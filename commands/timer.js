const MAX_TIMEOUT_MINUTES = Math.floor(0x7fffffff / 60000);

module.exports = async function(sock, chatId, msg, q) {
    const value = String(q ?? '').trim();
    if (!/^[1-9]\d*$/.test(value)) {
        return sock.sendMessage(chatId, { text: `⚠️ Use .timer <whole minutes> (1–${MAX_TIMEOUT_MINUTES}).` }, { quoted: msg });
    }
    const minutes = Number(value);
    if (!Number.isSafeInteger(minutes) || minutes > MAX_TIMEOUT_MINUTES) {
        return sock.sendMessage(chatId, { text: `⚠️ Timer must be between 1 and ${MAX_TIMEOUT_MINUTES} minutes.` }, { quoted: msg });
    }
    const ms = minutes * 60 * 1000;
    await sock.sendMessage(chatId, { text: `⏰ Timer set for ${minutes} minute(s)!` }, { quoted: msg });
    setTimeout(async () => {
        try {
            await sock.sendMessage(chatId, { text: `⏰ *TIME'S UP!*\n\n${minutes} minute(s) have passed!` });
        } catch (_) {}
    }, ms);
};
