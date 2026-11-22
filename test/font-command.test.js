const test = require('node:test');
const assert = require('node:assert/strict');
const fontCommand = require('../commands/font');
const allMenuCommand = require('../commands/allmenu');
const { generateMenuText } = require('../lib/menu-text');

test('.font produces exactly 50 uniquely named and visibly different styles', () => {
    const styles = fontCommand.styles;
    const lines = fontCommand.makeFontStyles('Hello 123');
    assert.equal(styles.length, 50);
    assert.equal(new Set(styles.map(([name]) => name)).size, 50);
    assert.equal(lines.length, 50);
    assert.equal(new Set(lines).size, 50);
    assert.match(lines[0], /Bold: 𝐇𝐞𝐥𝐥𝐨/);
    assert.match(lines[7], /Double-Struck: ℍ/); // first letter uses the correct legacy Unicode glyph
});

test('.font returns all 50 styles in one message and supports quoted text', async () => {
    const sent = [];
    const sock = { async sendMessage(chatId, payload, options) { sent.push({ chatId, payload, options }); } };
    const msg = { message: { extendedTextMessage: { contextInfo: { quotedMessage: { conversation: 'Quoted words' } } } } };

    await fontCommand(sock, 'chat', msg);
    const outputLines = sent[0].payload.text.split('\n');
    assert.equal(sent[0].chatId, 'chat');
    assert.equal(outputLines.length, 51);
    assert.equal(outputLines[0], '*50 FONT STYLES*');
    assert.match(outputLines[1], /Bold: 𝐐𝐮𝐨𝐭𝐞𝐝 𝐰𝐨𝐫𝐝𝐬/);
    assert.equal(sent[0].options.quoted, msg);
});

test('.font explains missing input and rejects overly long text', async () => {
    const sent = [];
    const sock = { async sendMessage(_chatId, payload) { sent.push(payload.text); } };
    await fontCommand(sock, 'chat', {}, '');
    await fontCommand(sock, 'chat', {}, 'x'.repeat(fontCommand.MAX_INPUT_LENGTH + 1));
    assert.match(sent[0], /Usage: `.font <text>`/);
    assert.match(sent[1], /100 characters or fewer/);
});

test('.font is listed in compact and complete menus when registered', async () => {
    const commands = { font: async () => {}, ping: async () => {} };
    const compact = generateMenuText('Tester', { isPublic: true }, commands, '.');
    assert.match(compact, /\.font/);

    const sent = [];
    const sock = { async sendMessage(_chatId, payload) {
        if (payload.image) throw new Error('mock cover unavailable');
        sent.push(payload.text);
    } };
    await allMenuCommand(sock, 'chat', {}, { isPublic: true }, commands, [], '.');
    assert.match(sent[0], /\.font/);
});
