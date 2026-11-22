const test = require('node:test');
const assert = require('node:assert/strict');
const { wrapCommandHandler } = require('../lib/command-wrapper');
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
