const test = require('node:test');
const assert = require('node:assert/strict');
const { wrapCommandHandler } = require('../lib/command-wrapper');
const { createThemedSocket, installThemedSocket, decorateText, THEME_HEADER, THEME_FOOTER } = require('../lib/akatsuki-theme');
const chatbot = require('../commands/chatbot');
const forward = require('../commands/forward');
const clear = require('../commands/clear');
const roll = require('../commands/roll');
const timer = require('../commands/timer');
const remind = require('../commands/remind');
const utils = require('../commands/utils');

function mockSocket() {
    const sent = [];
    return {
        sent,
        async sendMessage(chatId, payload, options) { sent.push({ chatId, payload, options }); }
    };
}

test('Akatsuki response styling frames plain text while preserving command spelling', () => {
    const decorated = decorateText('Use .ping with prefix !ping');
    assert.ok(decorated.startsWith(THEME_HEADER));
    assert.ok(decorated.endsWith(THEME_FOOTER));
    assert.ok(decorated.includes('Use .ping with prefix !ping'));
});

test('themed socket styles text and captions once without altering other payload fields', async () => {
    const sent = [];
    const sock = { async sendMessage(chatId, message, options) { sent.push({ chatId, message, options, receiver: this }); } };
    const themed = createThemedSocket(createThemedSocket(sock));
    const image = Buffer.from('image');
    const options = { quoted: { key: 'message' } };

    await themed.sendMessage('chat', { image, text: 'Bot reply', caption: 'Image reply' }, options);

    assert.equal(sent.length, 1);
    assert.equal(sent[0].receiver, sock);
    assert.equal(sent[0].chatId, 'chat');
    assert.equal(sent[0].options, options);
    assert.equal(sent[0].message.image, image);
    assert.ok(sent[0].message.text.startsWith(THEME_HEADER));
    assert.ok(sent[0].message.text.endsWith(THEME_FOOTER));
    assert.ok(sent[0].message.caption.startsWith(THEME_HEADER));
    assert.ok(sent[0].message.caption.endsWith(THEME_FOOTER));
    assert.equal((sent[0].message.text.match(/𝗔𝗞𝗔𝗧𝗦𝗨𝗞𝗜/g) || []).length, 1);
});

test('global style installation preserves the original socket object and method receiver', async () => {
    const sent = [];
    const sock = {
        async sendMessage(chatId, message, options) {
            assert.equal(this, sock);
            sent.push({ chatId, message, options });
        }
    };

    assert.equal(installThemedSocket(sock), sock);
    assert.equal(installThemedSocket(sock), sock);
    await sock.sendMessage('chat', { text: 'The menu is ready' }, { quoted: 'original-message' });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].chatId, 'chat');
    assert.equal(sent[0].options.quoted, 'original-message');
    assert.ok(sent[0].message.text.includes('The menu is ready'));
    assert.ok(sent[0].message.text.startsWith(THEME_HEADER));
});

test('already themed menu and font layouts are not decorated a second time', () => {
    const existingLayouts = [
        '╔══════════════════════════════════╗\n.menu',
        '╭━━━━━━━━━━━━━━━━━━━━━━╮\n.allmenu',
        '*🩸 AKATSUKI • 50 FONT STYLES 🩸*\n01. Bold'
    ];
    for (const text of existingLayouts) assert.equal(decorateText(text), text);
});

test('command wrapper retains enumerable helper properties', () => {
    const handler = () => {};
    handler.findMatch = () => 'match';
    const wrapped = wrapCommandHandler(handler);
    assert.equal(wrapped.findMatch, handler.findMatch);
});

test('chatbot toggle rejects unauthorized users without changing session state', async () => {
    const sock = mockSocket();
    const session = { aiEnabled: false };
    await chatbot(sock, 'chat', {}, session, ['on'], false);
    assert.equal(session.aiEnabled, false);
    assert.match(sock.sent[0].payload.text, /Only the owner or an authorized/);
});

test('forward sends the quoted message content and refuses an absent quote', async () => {
    const sock = mockSocket();
    const quote = { conversation: 'quoted content' };
    const msg = { message: { extendedTextMessage: { contextInfo: {
        stanzaId: 'quoted-id', remoteJid: 'source@s.whatsapp.net', participant: 'author@s.whatsapp.net', quotedMessage: quote
    } } } };
    await forward(sock, 'chat', msg, true, '12345');
    assert.equal(sock.sent[0].chatId, '12345@s.whatsapp.net');
    assert.deepEqual(sock.sent[0].payload.forward.message, quote);
    assert.equal(sock.sent[0].payload.forward.key.id, 'quoted-id');

    const noQuoteSocket = mockSocket();
    await forward(noQuoteSocket, 'chat', { message: {} }, true, '12345');
    assert.match(noQuoteSocket.sent[0].payload.text, /Reply to a message/);
});

test('clear accurately states that no messages were deleted', async () => {
    const sock = mockSocket();
    await clear(sock, 'chat', {});
    assert.match(sock.sent[0].payload.text, /No messages were deleted/);
});

test('roll, timer, and reminder reject malformed or unsafe durations', async () => {
    for (const [command, args] of [[roll, ['2abc']], [roll, ['1']], [timer, ['0']], [timer, ['1.5']], [remind, ['-1 do this']]]) {
        const sock = mockSocket();
        await command(sock, 'chat', {}, args[0]);
        assert.equal(sock.sent.length, 1);
        assert.match(sock.sent[0].payload.text, /⚠️|whole minutes|Reminder duration|minutes/);
    }
});

test('calculator rejects unsupported code and handles exponent notation', async () => {
    const sock = mockSocket();
    await utils.calc(sock, 'chat', {}, '2^3');
    assert.match(sock.sent[0].payload.text, /Result:\* 8/);
    const unsafeSocket = mockSocket();
    await utils.calc(unsafeSocket, 'chat', {}, 'process.exit()');
    assert.match(unsafeSocket.sent[0].payload.text, /Math Error/);
});
