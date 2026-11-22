module.exports = async function(sock, chatId, msg, q) {
    const rawSides = String(q ?? '').trim();
    const parsedSides = /^\d+$/.test(rawSides) ? Number(rawSides) : NaN;
    if (rawSides && (!Number.isSafeInteger(parsedSides) || parsedSides < 2 || parsedSides > 1000000)) {
        return sock.sendMessage(chatId, { text: '⚠️ Choose a die size from 2 to 1,000,000, such as `.roll 20`.' }, { quoted: msg });
    }
    const sides = rawSides ? parsedSides : 6;
    const result = Math.floor(Math.random() * sides) + 1;
    await sock.sendMessage(chatId, {
        text: `*🎲 Rolling d${sides}*\n\nRolling...\n\n*Result: ${result}!*`
    }, { quoted: msg });
};
