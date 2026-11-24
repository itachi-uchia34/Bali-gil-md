async function publicCommand(sock, from, msg, isOwner, session) {
    if (!isOwner) return await sock.sendMessage(from, { text: "❌ Only owner can use this command." }, { quoted: msg });
    
    session.isPublic = true;
    await sock.sendMessage(from, { text: "🌍 Bot is now in PUBLIC mode. Everyone can use it." }, { quoted: msg });
}

module.exports = publicCommand;
