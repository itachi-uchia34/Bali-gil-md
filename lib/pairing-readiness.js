'use strict';

/**
 * Wait until Baileys has emitted the initial QR/connection handshake before
 * requesting a phone pairing code. Some Baileys versions expose this helper;
 * older versions use a short delay rather than an unbounded wait.
 */
async function waitForPairingReady(sock, {
    timeoutMs = 20000,
    fallbackDelayMs = 750,
    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
} = {}) {
    if (typeof sock?.waitForConnectionUpdate === 'function') {
        await sock.waitForConnectionUpdate(
            (update) => update?.connection === 'open' || Boolean(update?.qr),
            timeoutMs
        );
        return { ready: true };
    }
    await delay(fallbackDelayMs);
    return { fallback: true };
}

module.exports = { waitForPairingReady };
