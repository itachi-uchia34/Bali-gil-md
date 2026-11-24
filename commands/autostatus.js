/**
 * Handle one WhatsApp status update (auto-seen, auto-like and optional download).
 * The caller must pass the individual message from `messages.upsert`, not its batch.
 */
async function handleStatusUpdate(sock, msg, botData, userId) {
    try {
        const settings = botData?.statusSettings?.[userId];
        if (!settings || !settings.autoStatus || !msg?.key || msg.key.remoteJid !== 'status@broadcast') return false;

        const from = msg.key.participant || msg.key.remoteJid;

        if (settings.autoSeen) {
            await sock.readMessages([msg.key]);
        }

        if (settings.autoLike) {
            const emojis = ['❤️', '👍', '🔥', '👏', '😮', '😂', '🙌', '✨', '⭐', '✅'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            await sock.sendMessage('status@broadcast', {
                react: { text: randomEmoji, key: msg.key }
            }, { statusJidList: [from] });
        }

        // Auto-download is intentionally a no-op until its media policy/limits are configured.
        return true;
    } catch (e) {
        console.error('Error in handleStatusUpdate:', e);
        return false;
    }
}

module.exports = { handleStatusUpdate };
