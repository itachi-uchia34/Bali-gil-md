async function antilinkCommand(sock, from, msg, isAdmin, botData, saveBotData, args) {
    if (!from.endsWith('@g.us')) {
        await sock.sendMessage(from, { text: '⚠️ `.antilink` can only be used inside a group.' }, { quoted: msg });
        return;
    }
    if (!isAdmin) {
        await sock.sendMessage(from, { text: '❌ Only group admins can activate the Akatsuki barrier.' }, { quoted: msg });
        return;
    }

    botData.antilinkGroups ||= {};
    const action = String(args[0] || '').trim().toLowerCase();
    if (!['on', 'del', 'kick', 'off', 'status'].includes(action)) {
        await sock.sendMessage(from, { text: 'Usage: `.antilink on`, `.antilink kick`, `.antilink off`, or `.antilink status`' }, { quoted: msg });
        return;
    }

    if (action === 'status') {
        const mode = botData.antilinkGroups[from];
        const status = mode === 'kick' ? 'enabled — delete links and remove the sender' : mode === 'del' ? 'enabled — delete links only' : 'disabled';
        await sock.sendMessage(from, { text: `🩸 *AKATSUKI BARRIER STATUS*\n\nAnti-link is *${status}*.` }, { quoted: msg });
        return;
    }

    if (action === 'off') {
        delete botData.antilinkGroups[from];
        saveBotData();
        await sock.sendMessage(from, { text: '✅ *AKATSUKI BARRIER DISABLED*\n\nLinks are no longer automatically removed.' }, { quoted: msg });
        return;
    }

    botData.antilinkGroups[from] = action === 'kick' ? 'kick' : 'del';
    saveBotData();
    const modeText = action === 'kick' ? 'links will be deleted and the sender will be removed' : 'links will be deleted while members remain';
    await sock.sendMessage(from, { text: `🩸 *AKATSUKI BARRIER ACTIVATED*\n\nThe Shroud is watching. ${modeText}.` }, { quoted: msg });
}

module.exports = antilinkCommand;
