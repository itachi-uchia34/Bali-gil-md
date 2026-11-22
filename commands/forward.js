module.exports = async function(sock, chatId, msg, isOwner, q) {
    if (!isOwner) return await sock.sendMessage(chatId, { text: '\u274C Owner only!' }, { quoted: msg });
    if (!q) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F .fwd <number>' }, { quoted: msg });
    
    try {
        const number = q.replace(/\D/g, '') + '@s.whatsapp.net';
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        
        if (!contextInfo?.quotedMessage || !contextInfo?.stanzaId) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F Reply to a message to forward!' }, { quoted: msg });
        
        const sourceKey = {
            remoteJid: contextInfo.remoteJid || chatId,
            id: contextInfo.stanzaId,
            fromMe: false
        };
        if (contextInfo.participant) sourceKey.participant = contextInfo.participant;
        const quotedMessage = { key: sourceKey, message: contextInfo.quotedMessage };
        await sock.sendMessage(number, { forward: quotedMessage });
        await sock.sendMessage(chatId, { text: `\u2705 Message forwarded to ${q}` }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(chatId, { text: '\u274C Error: ' + e.message }, { quoted: msg });
    }
};
