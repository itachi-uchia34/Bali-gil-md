'use strict';

/**
 * Wait until Baileys has emitted the initial QR/connection handshake before
 * requesting a phone pairing code. Reuse startup events already captured by the
 * caller, and use a bounded event-emitter fallback when a release lacks the
 * socket's wait helper.
 */
async function waitForPairingReady(sock, {
    timeoutMs = 20000,
    fallbackDelayMs = 750,
    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    initialUpdates = []
} = {}) {
    const isReady = (update) => update?.connection === 'open' || Boolean(update?.qr);
    if (Array.isArray(initialUpdates)) {
        const lastSignal = [...initialUpdates].reverse().find((update) => isReady(update) || update?.connection === 'close');
        if (lastSignal?.connection === 'close') {
            throw lastSignal.lastDisconnect?.error || new Error('WhatsApp connection closed before pairing was ready.');
        }
        if (lastSignal) return { ready: true };
    }

    if (typeof sock?.waitForConnectionUpdate === 'function') {
        await sock.waitForConnectionUpdate(
            isReady,
            timeoutMs
        );
        return { ready: true };
    }

    if (typeof sock?.ev?.on === 'function') {
        await new Promise((resolve, reject) => {
            let timer;
            const cleanup = () => {
                if (timer) clearTimeout(timer);
                sock.ev.off?.('connection.update', onUpdate);
                sock.ev.removeListener?.('connection.update', onUpdate);
            };
            const onUpdate = (update) => {
                if (update?.connection === 'close') {
                    cleanup();
                    reject(update.lastDisconnect?.error || new Error('WhatsApp connection closed before pairing was ready.'));
                } else if (isReady(update)) {
                    cleanup();
                    resolve();
                }
            };
            timer = setTimeout(() => {
                cleanup();
                reject(new Error(`Timed out waiting ${timeoutMs}ms for the WhatsApp pairing handshake.`));
            }, timeoutMs);
            sock.ev.on('connection.update', onUpdate);
        });
        return { ready: true };
    }

    await delay(fallbackDelayMs);
    return { fallback: true };
}

module.exports = { waitForPairingReady };
