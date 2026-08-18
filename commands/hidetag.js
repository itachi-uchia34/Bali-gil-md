async function hidetagCommand(sock, from, msg, isAdmin, q) {
    if (!isAdmin || !from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '🩸 *AKATSUKI ACCESS DENIED*\nOnly group admins can issue this command.' }, { quoted: msg });
    
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants.map(p => p.id);
    
    await sock.sendMessage(from, { 
        text: q || "Hi Everyone!", 
        mentions: participants 
    });
}

module.exports = hidetagCommand;
