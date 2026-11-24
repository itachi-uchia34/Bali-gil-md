async function unbanCommand(sock, from, msg, isAdmin, q) {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }
    if (!isAdmin) {
        return sock.sendMessage(from, { text: '❌ Only group admins can use unban commands.' }, { quoted: msg });
    }

    const context = msg.message?.extendedTextMessage?.contextInfo;
    const participant = context?.mentionedJid?.[0] || context?.participant;
    const number = (q || '').replace(/[^0-9]/g, '');
    const target = participant || (number ? `${number}@s.whatsapp.net` : null);

    if (!target) {
        return sock.sendMessage(from, { text: '⚠️ Reply to the user’s message, mention them, or provide a phone number.\nExample: .unban1 923001234567' }, { quoted: msg });
    }

    try {
        await sock.groupParticipantsUpdate(from, [target], 'add');
        await sock.sendMessage(from, { text: `✅ Unban request completed for @${target.split('@')[0]}.`, mentions: [target] }, { quoted: msg });
    } catch (error) {
        await sock.sendMessage(from, { text: '❌ Could not unban or re-add this participant. They may have privacy restrictions, or the bot may not be a group admin.' }, { quoted: msg });
    }
}

module.exports = unbanCommand;
