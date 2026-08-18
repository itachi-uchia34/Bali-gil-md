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
        const names = participants.map((jid) => `@${jid.split('@')[0]}`).join(' ');

        const text = `🩸 *━───── 🔴 BALI GIL 🔴 ─────━* 🩸

*⚔️ ORGANIZATION SUMMONS ⚔️*

The Shroud calls upon every shinobi in *${groupName}*.

📜 *ANNOUNCEMENT:*
${announcement}

👥 *RANKS SUMMONED:* ${participants.length}

${names}

> _"Those who do not understand true pain can never understand true peace."_

⚔️ Wear your ring, honor the cloak, and respond to the call. 🩸`;

        await sock.sendMessage(chatId, { text, mentions: participants }, { quoted: msg });
    } catch (error) {
        console.error('Tagall command error:', error);
        await sock.sendMessage(chatId, { text: `❌ Could not summon the group: ${error.message || 'unknown error'}` }, { quoted: msg });
    }
};
