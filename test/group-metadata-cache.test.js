const test = require('node:test');
const assert = require('node:assert/strict');
const { getGroupMetadataCached } = require('../lib/group-metadata-cache');

test('concurrent group metadata lookups share one in-flight request', async () => {
    const cache = new Map();
    let calls = 0;
    let resolveRequest;
    const pending = new Promise((resolve) => { resolveRequest = resolve; });
    const sock = { groupMetadata: async () => { calls += 1; return pending; } };

    const first = getGroupMetadataCached(sock, cache, 'group@g.us');
    const second = getGroupMetadataCached(sock, cache, 'group@g.us');
    await Promise.resolve();
    assert.equal(calls, 1);
    const metadata = { participants: [] };
    resolveRequest(metadata);
    assert.equal(await first, metadata);
    assert.equal(await second, metadata);
});

test('group metadata is reused until TTL expiry and fetched again afterward', async () => {
    const cache = new Map();
    let clock = 1000;
    let calls = 0;
    const sock = { async groupMetadata() { calls += 1; return { revision: calls }; } };
    const options = { ttlMs: 1000, now: () => clock };

    assert.deepEqual(await getGroupMetadataCached(sock, cache, 'group@g.us', options), { revision: 1 });
    clock += 999;
    assert.deepEqual(await getGroupMetadataCached(sock, cache, 'group@g.us', options), { revision: 1 });
    assert.equal(calls, 1);
    clock += 2;
    assert.deepEqual(await getGroupMetadataCached(sock, cache, 'group@g.us', options), { revision: 2 });
    assert.equal(calls, 2);
});

test('failed group metadata requests are evicted so later calls can retry', async () => {
    const cache = new Map();
    let calls = 0;
    const sock = { async groupMetadata() {
        calls += 1;
        if (calls === 1) throw new Error('temporary');
        return { subject: 'ok' };
    } };

    await assert.rejects(getGroupMetadataCached(sock, cache, 'group@g.us'), /temporary/);
    assert.deepEqual(await getGroupMetadataCached(sock, cache, 'group@g.us'), { subject: 'ok' });
    assert.equal(calls, 2);
});
