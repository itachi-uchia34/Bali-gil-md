const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { dpzCommand } = require('../commands/dpz');

const customBoys = Array.from({ length: 10 }, (_, index) => `https://images.example/dpz-boy-${index + 1}.jpg`);

async function requestBatch(chatId, randomValue) {
    const originalRandom = Math.random;
    Math.random = () => randomValue;
    const sent = [];
    const sock = { async sendMessage(_chatId, payload, options) { sent.push({ payload, options }); } };
    const botData = { dpzSettings: { [chatId]: { enabled: true, mode: 'boys', customBoys, customGirls: [] } } };
    try {
        const result = await dpzCommand(sock, chatId, { key: { id: 'dpz-command' } }, 'boys', botData);
        return { sent, result };
    } finally {
        Math.random = originalRandom;
    }
}

test('.dpz sends eight distinct requested-style images in one invocation', async () => {
    const { sent, result } = await requestBatch('dpz-eight@g.us', 0);
    assert.equal(sent.length, 8);
    assert.equal(result.sent, 8);
    assert.equal(result.requested, 8);
    assert.equal(result.mode, 'boys');
    const urls = sent.map(({ payload }) => payload.image.url);
    assert.equal(new Set(urls).size, 8);
    assert.ok(sent.every(({ payload }) => payload.caption.includes('BOYS DPZ')));
    assert.match(sent[0].payload.caption, /IMAGE:\* 1\/8/);
    assert.deepEqual(sent[0].options, { quoted: { key: { id: 'dpz-command' } } });
});

test('.dpz batch size can reach ten and continues rotating without duplicates', async () => {
    const first = await requestBatch('dpz-rotation@g.us', 0.999);
    const next = await requestBatch('dpz-rotation@g.us', 0.999);
    assert.equal(first.sent.length, 10);
    assert.equal(next.sent.length, 10);
    const imageIds = (messages) => messages.map(({ payload }) => {
        const image = payload.image;
        return image.url || createHash('sha1').update(image).digest('hex');
    });
    const firstImages = imageIds(first.sent);
    const nextImages = imageIds(next.sent);
    assert.equal(new Set(firstImages).size, 10);
    assert.equal(new Set(nextImages).size, 10);
    assert.equal(firstImages.some(image => nextImages.includes(image)), false);
});
