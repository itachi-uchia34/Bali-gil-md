module.exports = async function(sock, chatId, msg, isOwner, sessions = {}) {
    if (!isOwner) return await sock.sendMessage(chatId, { text: '\u274C Owner only!' }, { quoted: msg });

    const activeSessions = Object.entries(sessions).filter(([, session]) => session?.sock || session?.isInitializing);
    await sock.sendMessage(chatId, { text: `\u1F6E0\uFE0F Restarting ${activeSessions.length} bot session(s)...` }, { quoted: msg });

    let restarted = 0;
    for (const [, session] of activeSessions) {
        try {
            await session.stop();
            session.stopRequested = false;
            await session.initialize();
            restarted++;
        } catch (error) {
            session.sendLog?.(`Restart failed: ${error.message}`, 'error');
        }
    }

    await sock.sendMessage(chatId, { text: `\u2705 Restart requested for ${restarted}/${activeSessions.length} bot session(s).` }, { quoted: msg });
};
