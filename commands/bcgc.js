module.exports = async function(sock, chatId, msg, isOwner, q) {
    if (!isOwner) return await sock.sendMessage(chatId, { text: '\u274C Owner only!' }, { quoted: msg });
    if (!q) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F .bcgc <message>' }, { quoted: msg });
    
    try {
        const groups = Object.keys(sock.chats).filter(jid => jid.endsWith('@g.us'));
        if (sock.antiAbuse) sock.antiAbuse.assertBroadcastAllowed(groups.length);
        await sock.sendMessage(chatId, { text: `\u1F4E2 Broadcasting to ${groups.length} groups...` }, { quoted: msg });
        
        let sent = 0;
        const sendBroadcast = sock.safeSendMessage || sock.sendMessage.bind(sock);
        for (const group of groups) {
            try {
                await sendBroadcast(group, { text: `*\u1F4E2 BROADCAST*\n\n${q}\n\n_From: ⚔️ BALI GIL MD ⚔️ Owner_` }, {}, { delayMs: 350, dedupe: true });
                sent++;
            } catch (e) {
                if (sock.antiAbuse?.paused) break;
            }
        }
        
        await sock.sendMessage(chatId, { text: `\u2705 Broadcast sent to ${sent} groups!` }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(chatId, { text: '\u274C Error: ' + e.message }, { quoted: msg });
    }
};
