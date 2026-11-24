const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const pingCommand = require('../commands/ping');
const { parseCommand } = require('../lib/command-parser');

const msg = { key: { id: 'ping-test' } };

test('.ping is parsed and routed to the latency command', () => {
    assert.equal(parseCommand('.ping').commandName, 'ping');
    const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
    assert.match(source, /case 'ping': await commands\.ping\(this\.sock, from, msg\)/);
});

test('.ping reports measured response latency in milliseconds by editing its probe message', async () => {
    const sent = [];
    const sock = {
        async sendMessage(chatId, payload, options) {
            sent.push({ chatId, payload, options });
            if (sent.length === 1) {
                await new Promise(resolve => setTimeout(resolve, 5));
                return { key: { id: 'probe-message' } };
            }
            return { key: { id: 'edited-message' } };
        }
    };

    await pingCommand(sock, 'chat', msg);

    assert.equal(sent.length, 2);
    assert.equal(sent[0].options.quoted, msg);
    assert.equal(sent[1].payload.edit.id, 'probe-message');
    assert.match(sent[1].payload.text, /Response latency:\* \d+ ms/);
});

test('.ping sends a normal latency reply when message editing is unsupported', async () => {
    const sent = [];
    const sock = {
        async sendMessage(chatId, payload, options) {
            sent.push({ chatId, payload, options });
            if (sent.length === 1) return { key: { id: 'probe-message' } };
            if (sent.length === 2) throw new Error('edit unsupported');
            return {};
        }
    };

    await pingCommand(sock, 'chat', msg);

    assert.equal(sent.length, 3);
    assert.equal(sent[2].options.quoted, msg);
    assert.match(sent[2].payload.text, /Response latency:\* \d+ ms/);
    assert.equal(sent[2].payload.edit, undefined);
});

test('.ping still reports latency if the socket does not return a message key', async () => {
    const sent = [];
    const sock = { async sendMessage(chatId, payload, options) { sent.push({ chatId, payload, options }); return {}; } };

    await pingCommand(sock, 'chat', msg);

    assert.equal(sent.length, 2);
    assert.match(sent[1].payload.text, /Response latency:\* \d+ ms/);
    assert.equal(sent[1].options.quoted, msg);
});
