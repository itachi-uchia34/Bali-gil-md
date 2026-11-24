function countConnectedSessions(sessions = {}) {
    if (!sessions || typeof sessions !== 'object') return 0;
    return Object.values(sessions).filter(session => session?.isConnected === true && session?.sock?.user).length;
}

async function runtimeCommand(sock, chatId, msg, sessions = {}) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const connected = countConnectedSessions(sessions);
    const total = sessions && typeof sessions === 'object' ? Object.keys(sessions).length : 0;
    const text = `*\u1F551 Runtime & Connections*\n\n` +
        `The bot has been running for:\n` +
        `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds\n\n` +
        `Connected WhatsApp accounts: ${connected}\n` +
        `Known sessions: ${total}\n\n` +
        `_Started: ${new Date(Date.now() - uptime * 1000).toLocaleString()}_`;
    
    await sock.sendMessage(chatId, { text }, { quoted: msg });
}

runtimeCommand.countConnectedSessions = countConnectedSessions;
module.exports = runtimeCommand;
