module.exports = async function(sock, chatId, msg, isOwner, sessions = {}) {
    if (!isOwner) return await sock.sendMessage(chatId, { text: '\u274C Owner only!' }, { quoted: msg });

    const activeSessions = Object.entries(sessions).filter(([, session]) => session?.sock || session?.isInitializing);
    await sock.sendMessage(chatId, { text: `\u1F4A3 Stopping ${activeSessions.length} bot session(s)...` }, { quoted: msg });

    let stopped = 0;
    for (const [, session] of activeSessions) {
        try {
            await session.stop();
            stopped++;
        } catch (error) {
            session.sendLog?.(`Stop failed: ${error.message}`, 'error');
        }
    }

    await sock.sendMessage(chatId, { text: `\u2705 Stopped ${stopped}/${activeSessions.length} bot session(s). Pairing credentials were preserved.` }, { quoted: msg });
};
