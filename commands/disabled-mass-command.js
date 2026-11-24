const noticeTimes = new Map();
const NOTICE_COOLDOWN_MS = 60 * 60 * 1000;

module.exports = async function disabledMassCommand(sock, chatId, msg) {
    const now = Date.now();
    const key = String(chatId || 'unknown');
    const lastNotice = noticeTimes.get(key) || 0;
    if (now - lastNotice < NOTICE_COOLDOWN_MS) return false;

    noticeTimes.set(key, now);
    for (const [chat, timestamp] of noticeTimes) {
        if (now - timestamp >= NOTICE_COOLDOWN_MS) noticeTimes.delete(chat);
    }

    return sock.sendMessage(chatId, {
        text: '🛡️ Bulk, spam, and bombing actions are disabled to protect recipients and this account. Only message people or groups that have opted in; no bot can guarantee protection from reports or platform restrictions.'
    }, { quoted: msg });
};

module.exports.NOTICE_COOLDOWN_MS = NOTICE_COOLDOWN_MS;
module.exports.disabled = true;
