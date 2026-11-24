const test = require('node:test');
const assert = require('node:assert/strict');
const runtimeCommand = require('../commands/runtime');

const sessions = {
    connectedOne: { isConnected: true, sock: { user: { id: '923000000001@s.whatsapp.net' } } },
    connectedTwo: { isConnected: true, sock: { user: { id: '923000000002@s.whatsapp.net' } } },
    connecting: { isConnected: false, sock: { user: { id: '923000000003@s.whatsapp.net' } } },
    missingSocket: { isConnected: true }
};

test('.runtime counts only sessions with a live connection and socket user', () => {
    assert.equal(runtimeCommand.countConnectedSessions(sessions), 2);
    assert.equal(runtimeCommand.countConnectedSessions(null), 0);
});

test('.runtime reports uptime and connected WhatsApp account totals', async () => {
    let sent;
    const msg = { key: { id: 'runtime-message' } };
    const sock = { async sendMessage(chatId, payload, options) { sent = { chatId, payload, options }; } };

    await runtimeCommand(sock, 'chat', msg, sessions);

    assert.equal(sent.chatId, 'chat');
    assert.match(sent.payload.text, /Runtime & Connections/);
    assert.match(sent.payload.text, /days, .*hours, .*minutes, .*seconds/);
    assert.match(sent.payload.text, /Connected WhatsApp accounts: 2/);
    assert.match(sent.payload.text, /Known sessions: 4/);
    assert.equal(sent.options.quoted, msg);
});
