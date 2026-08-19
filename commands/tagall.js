module.exports = async function tagallCommand(sock, chatId, msg, isAdmin, query) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ `.tagall` can only be used inside a group.' }, { quoted: msg });
        return;
    }

    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can summon the entire organization.' }, { quoted: msg });
        return;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = (metadata.participants || [])
            .map((participant) => participant.id || participant.jid)
            .filter(Boolean);
        const groupName = metadata.subject || 'the group';
        const announcement = String(query || '').trim() || 'The Akatsuki has summoned every member. Stand by for further orders.';
        const mentionNames = participants.map((jid) => `@${jid.split('@')[0]}`);
        const mentionRows = [];
        for (let i = 0; i < mentionNames.length; i += 4) {
            mentionRows.push(mentionNames.slice(i, i + 4).join(' '));
        }

        const text = [
            '🩸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🩸',
            '🔴 BALI GIL MD ┃ AKATSUKI SUMMONS 🔴',
            '🩸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🩸',
            `🏯 GROUP: ${groupName} ┃ 👥 MEMBERS: ${participants.length}`,
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '📜 ANNOUNCEMENT',
            announcement,
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '⚔️ SUMMONED SHINOBI',
            mentionRows.join('\n'),
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '> _"Those who do not understand true pain can never understand true peace."_',
            '🩸 Wear the cloak ┃ Honor the ring ┃ Respond to the call',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            'POWERED BY ITACHI-UCHIHA ©'
        ].join('\n');

        await sock.sendMessage(chatId, { text, mentions: participants }, { quoted: msg });
    } catch (error) {
        console.error('Tagall command error:', error);
        await sock.sendMessage(chatId, { text: `❌ Could not summon the group: ${error.message || 'unknown error'}` }, { quoted: msg });
    }
};
