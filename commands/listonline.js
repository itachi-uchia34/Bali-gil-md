module.exports = async function(sock, chatId, msg) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { text: '❌ This command only works in groups.' }, { quoted: msg });
        }
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = Array.isArray(groupMetadata.participants) ? groupMetadata.participants : [];
        const lines = participants.map((participant, index) => {
            const rank = participant.admin === 'superadmin' ? ' 👑' : participant.admin === 'admin' ? ' 🛡️' : '';
            return `${index + 1}. @${String(participant.id).split('@')[0]}${rank}`;
        });
        const text = `*Group Participants*\n\n` +
            `Total members: ${participants.length}\n` +
            `Live online status is not reliably exposed by WhatsApp to this bot.\n\n` +
            `*Participants:*\n${lines.join('\n')}`;
        await sock.sendMessage(chatId, { text, mentions: participants.map((participant) => participant.id) }, { quoted: msg });
    } catch (error) {
        await sock.sendMessage(chatId, { text: `❌ Error: ${error.message}` }, { quoted: msg });
    }
};
