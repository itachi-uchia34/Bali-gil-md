const test = require('node:test');
const assert = require('node:assert/strict');
const settings = require('../settings');
const ownerpromote = require('../commands/ownerpromote');

const ownerNumber = String(settings.ownerNumber).split(',')[0].replace(/\D/g, '');
const ownerJid = `${ownerNumber}@s.whatsapp.net`;
const botJid = '923001112222@s.whatsapp.net';
const groupJid = '120363000000000000@g.us';

function createMock({ participants = [], promoteError } = {}) {
    const sent = [];
    const promoted = [];
    let metadataCalls = 0;
    const sock = {
        user: { id: botJid },
        sent,
        promoted,
        get metadataCalls() { return metadataCalls; },
        async sendMessage(chatId, payload, options) { sent.push({ chatId, payload, options }); },
        async groupMetadata(chatId) { metadataCalls += 1; assert.equal(chatId, groupJid); return { participants }; },
        async groupParticipantsUpdate(chatId, jids, action) {
            if (promoteError) throw promoteError;
            promoted.push({ chatId, jids, action });
        }
    };
    return sock;
}

function participants({ botAdmin = true, ownerAdmin = null, includeOwner = true } = {}) {
    return [
        ...(includeOwner ? [{ id: ownerJid, admin: ownerAdmin }] : []),
        { id: botJid, admin: botAdmin ? 'admin' : null }
    ];
}

test('only the configured owner can use .ownerpromote', async () => {
    const sock = createMock({ participants: participants() });
    await ownerpromote(sock, groupJid, {}, false, ownerJid);
    assert.equal(sock.metadataCalls, 0);
    assert.equal(sock.promoted.length, 0);
    assert.match(sock.sent[0].payload.text, /configured bot owner number/i);
});

test('owner cannot invoke .ownerpromote in a private chat', async () => {
    const sock = createMock({ participants: participants() });
    await ownerpromote(sock, ownerJid, {}, true, ownerJid);
    assert.equal(sock.metadataCalls, 0);
    assert.equal(sock.promoted.length, 0);
    assert.match(sock.sent[0].payload.text, /inside a group/i);
});

test('command cannot be used by the bot identity to bypass configured owner-number checks', async () => {
    const sock = createMock({ participants: participants() });
    await ownerpromote(sock, groupJid, {}, true, botJid);
    assert.equal(sock.metadataCalls, 0);
    assert.equal(sock.promoted.length, 0);
});

test('bot must already be a group admin before promoting the owner', async () => {
    const sock = createMock({ participants: participants({ botAdmin: false }) });
    await ownerpromote(sock, groupJid, {}, true, ownerJid);
    assert.equal(sock.promoted.length, 0);
    assert.match(sock.sent[0].payload.text, /must make the bot an admin first/i);
});

test('configured owner must already be a group member', async () => {
    const sock = createMock({ participants: participants({ includeOwner: false }) });
    await ownerpromote(sock, groupJid, {}, true, ownerJid);
    assert.equal(sock.promoted.length, 0);
    assert.match(sock.sent[0].payload.text, /must be a member/i);
});

test('owner promotion targets only the configured owner and mentions the result', async () => {
    const sock = createMock({ participants: participants() });
    const msg = { key: { id: 'command-id' } };
    await ownerpromote(sock, groupJid, msg, true, `${ownerNumber}:7@s.whatsapp.net`);
    assert.deepEqual(sock.promoted, [{ chatId: groupJid, jids: [ownerJid], action: 'promote' }]);
    assert.deepEqual(sock.sent[0].payload.mentions, [ownerJid]);
    assert.equal(sock.sent[0].options.quoted, msg);
    assert.match(sock.sent[0].payload.text, /promoted to group admin/i);
});

test('already-admin owner is not promoted again', async () => {
    const sock = createMock({ participants: participants({ ownerAdmin: 'admin' }) });
    await ownerpromote(sock, groupJid, {}, true, ownerJid);
    assert.equal(sock.promoted.length, 0);
    assert.match(sock.sent[0].payload.text, /already a group admin/i);
});

test('WhatsApp promotion errors are returned without pretending the action succeeded', async () => {
    const sock = createMock({ participants: participants(), promoteError: new Error('not-authorized') });
    await ownerpromote(sock, groupJid, {}, true, ownerJid);
    assert.equal(sock.promoted.length, 0);
    assert.match(sock.sent[0].payload.text, /Promotion failed: not-authorized/);
    assert.doesNotMatch(sock.sent[0].payload.text, /promoted to group admin/i);
});

test('.ownerpromote is registered, routed with owner authorization, and documented', async () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
    assert.match(source, /ownerpromote: require\('\.\/commands\/ownerpromote'\)/);
    assert.match(source, /case 'ownerpromote': await commands\.ownerpromote\(this\.sock, from, msg, isOwner, sender\)/);

    let helpText = '';
    const ownerCommands = require('../commands/ownerplus');
    await ownerCommands.ownerhelp({ async sendMessage(_chatId, payload) { helpText = payload.text; } }, groupJid, {}, true);
    assert.match(helpText, /\.ownerpromote/);
});
