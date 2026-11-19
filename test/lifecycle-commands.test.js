const test = require('node:test');
const assert = require('node:assert/strict');
const restartSessions = require('../commands/xrestart');
const stopSessions = require('../commands/xshutdown');

function createSocket() {
    const messages = [];
    return {
        messages,
        async sendMessage(chatId, payload, options) {
            messages.push({ chatId, payload, options });
        }
    };
}

test('xrestart rejects non-owners without touching sessions', async () => {
    const sock = createSocket();
    let stopped = false;
    await restartSessions(sock, 'chat', {}, false, {
        one: { sock: {}, async stop() { stopped = true; } }
    });
    assert.equal(stopped, false);
    assert.match(sock.messages[0].payload.text, /Owner only/);
});

test('xrestart safely stops and reinitializes all active sessions', async () => {
    const sock = createSocket();
    const calls = [];
    const sessions = {
        one: { sock: {}, async stop() { calls.push('stop-one'); }, async initialize() { calls.push('start-one'); } },
        two: { sock: {}, async stop() { calls.push('stop-two'); }, async initialize() { calls.push('start-two'); } },
        idle: { sock: null, isInitializing: false }
    };
    await restartSessions(sock, 'chat', {}, true, sessions);
    assert.deepEqual(calls, ['stop-one', 'start-one', 'stop-two', 'start-two']);
    assert.match(sock.messages.at(-1).payload.text, /2\/2/);
});

test('xshutdown stops sessions without logging out or deleting credentials', async () => {
    const sock = createSocket();
    let stopCount = 0;
    const sessions = {
        one: { sock: {}, async stop() { stopCount++; } },
        idle: { sock: null, isInitializing: false }
    };
    await stopSessions(sock, 'chat', {}, true, sessions);
    assert.equal(stopCount, 1);
    assert.ok(sessions.one);
    assert.match(sock.messages.at(-1).payload.text, /credentials were preserved/);
});
