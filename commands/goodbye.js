// commands/goodbye.js
// Adds a .goodbye command that sends a styled exile message in groups.

module.exports = async function(sock, from, msg, isAdmin, q) {
    try {
        if (!from || !from.endsWith('@g.us')) {
            return await sock.sendMessage(from, { text: 'This command must be used in a group.' }, { quoted: msg });
        }

        // Fetch group metadata (subject, participants)
        let metadata = {};
        try {
            metadata = await sock.groupMetadata(from);
        } catch (e) {
            if (sock.fetchGroupMetadata) metadata = await sock.fetchGroupMetadata(from);
        }

        const groupName = (metadata && metadata.subject) ? metadata.subject : 'this group';
        const count = (metadata && metadata.participants) ? metadata.participants.length : 0;

        // Determine target user to mention: replied user or the command sender
        let targetJid;
        const ctx = msg.message && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo;
        if (ctx && ctx.participant) {
            targetJid = ctx.participant;
        } else {
            targetJid = msg.key.participant || msg.key.remoteJid;
        }

        const mentionText = targetJid ? `@${targetJid.split('@')[0]}` : '@user';

        const goodbyeText = `☁️ *━───── 🗡️ EXILE NOTICE 🗡️ ─────━* ☁️\n\n*An exile has departed...* \n\n👋 ${mentionText} has deserted *${groupName}*.\n👥 *Remaining Ranks:* *${count}*\n\n> _"True art is an explosion... and your presence here just burned out."_ 💥\n\nCross their name off the scroll. The shadows move forward without hesitation.`;

        await sock.sendMessage(from, { text: goodbyeText, mentions: [targetJid].filter(Boolean) }, { quoted: msg });

    } catch (err) {
        console.error('goodbye command error', err);
        try {
            await sock.sendMessage(from, { text: 'Failed to send goodbye message.' }, { quoted: msg });
        } catch (e) { /* ignore */ }
    }
};
