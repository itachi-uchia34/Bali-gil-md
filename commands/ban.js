async function banCommand(sock, from, msg, isAdmin, q) {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }
    if (!isAdmin) {
        return sock.sendMessage(from, { text: '❌ Only group admins can use ban commands.' }, { quoted: msg });
    }

    const context = msg.message?.extendedTextMessage?.contextInfo;
    const participant = context?.mentionedJid?.[0] || context?.participant;
    const number = (q || '').replace(/[^0-9]/g, '');
    const target = participant || (number ? `${number}@s.whatsapp.net` : null);

    if (!target) {
        return sock.sendMessage(from, { text: '⚠️ Reply to the user’s message, mention them, or provide a phone number.\nExample: .ban1 923001234567' }, { quoted: msg });
    }

    try {
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        await sock.sendMessage(from, { text: `✅ Ban action completed for @${target.split('@')[0]}.`, mentions: [target] }, { quoted: msg });
    } catch (error) {
        await sock.sendMessage(from, { text: '❌ Could not ban this participant. Make sure the bot is a group admin and the target is valid.' }, { quoted: msg });
    }
}

module.exports = banCommand;
