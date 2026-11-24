'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const QRCode = require('qrcode');
const { waitForPairingReady } = require('../lib/pairing-readiness');

test('pairing readiness waits for QR or open connection before continuing', async () => {
    let predicate;
    let timeout;
    const result = await waitForPairingReady({
        waitForConnectionUpdate: async (check, ms) => {
            predicate = check;
            timeout = ms;
            return undefined;
        }
    }, { timeoutMs: 1234 });

    assert.equal(timeout, 1234);
    assert.equal(predicate({ connection: 'connecting' }), false);
    assert.equal(predicate({ qr: 'qr-token' }), true);
    assert.equal(predicate({ connection: 'open' }), true);
    assert.deepEqual(result, { ready: true });
});

test('pairing readiness rejects a timed-out modern Baileys handshake', async () => {
    await assert.rejects(
        waitForPairingReady({ waitForConnectionUpdate: async () => { throw new Error('timed out'); } }),
        /timed out/
    );
});

test('pairing readiness accepts a QR event already seen during socket startup', async () => {
    let waitCalled = false;
    const result = await waitForPairingReady({
        waitForConnectionUpdate: async () => { waitCalled = true; }
    }, { initialUpdates: [{ connection: 'connecting' }, { qr: 'early-qr-token' }] });
    assert.deepEqual(result, { ready: true });
    assert.equal(waitCalled, false);
});

test('a later startup close takes precedence over an earlier QR signal', async () => {
    await assert.rejects(
        waitForPairingReady({}, { initialUpdates: [{ qr: 'old-qr-token' }, { connection: 'close' }] }),
        /connection closed before pairing was ready/i
    );
});

test('older Baileys event emitters wait for QR and detach the temporary listener', async () => {
    const { EventEmitter } = require('node:events');
    const ev = new EventEmitter();
    const waiting = waitForPairingReady({ ev }, { timeoutMs: 100, fallbackDelayMs: 1 });
    setTimeout(() => ev.emit('connection.update', { qr: 'legacy-qr-token' }), 5);
    assert.deepEqual(await waiting, { ready: true });
    assert.equal(ev.listenerCount('connection.update'), 0);
});

test('older Baileys compatibility path uses only the configured short delay', async () => {
    const delays = [];
    const result = await waitForPairingReady({}, {
        fallbackDelayMs: 321,
        delay: async (ms) => delays.push(ms)
    });
    assert.deepEqual(delays, [321]);
    assert.deepEqual(result, { fallback: true });
});

test('QR linking payload can be rendered as an embeddable browser image', async () => {
    const dataUrl = await QRCode.toDataURL('whatsapp-pairing-test-token', { width: 320, margin: 2 });
    assert.match(dataUrl, /^data:image\/png;base64,/);
});
