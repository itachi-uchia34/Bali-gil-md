async function jidFooterCommand(sock, from, msg, isAdmin, q, botData, saveBotData, userId) {
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only admins or the bot owner can change the JID footer.' }, { quoted: msg });
    if (!botData.jidFooters) botData.jidFooters = {};
    const config = botData.jidFooters[userId] || { enabled: false, mode: 'both' };
    botData.jidFooters[userId] = config;
    const action = String(q || '').trim().toLowerCase();

    if (action === 'on' || action === 'enable') {
        config.enabled = true;
        saveBotData();
        return sock.sendMessage(from, { text: '✅ *JID FOOTER ENABLED*\n\nEvery text response can now show the configured JID information.' }, { quoted: msg });
    }
    if (action === 'off' || action === 'disable') {
        config.enabled = false;
        saveBotData();
        return sock.sendMessage(from, { text: '❌ *JID FOOTER DISABLED*' }, { quoted: msg });
    }
    if (['sender', 'chat', 'both'].includes(action)) {
        config.enabled = true;
        config.mode = action;
        saveBotData();
        return sock.sendMessage(from, { text: `✅ JID footer mode set to *${action}*.` }, { quoted: msg });
    }
    if (action === 'status' || !action) {
        return sock.sendMessage(from, { text: `⚡ *JID FOOTER STATUS*\n\nStatus: ${config.enabled ? '✅ ON' : '❌ OFF'}\nMode: ${config.mode}\n\nUsage: .jidfooter on/off/sender/chat/both` }, { quoted: msg });
    }
    return sock.sendMessage(from, { text: 'Usage: .jidfooter on | off | sender | chat | both | status' }, { quoted: msg });
}

module.exports = jidFooterCommand;
