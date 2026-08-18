module.exports = async function goodbyeCommand(sock, chatId, msg, isAdmin, session, args, botData, saveBotData) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ Use `.goodbye on` or `.goodbye off` inside a group.' }, { quoted: msg });
        return;
    }

    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can change the goodbye setting.' }, { quoted: msg });
        return;
    }

    const action = String(args[0] || '').trim().toLowerCase();
    if (!['on', 'off', 'status'].includes(action)) {
        await sock.sendMessage(chatId, { text: 'Usage: `.goodbye on`, `.goodbye off`, or `.goodbye status`' }, { quoted: msg });
        return;
    }

    if (action === 'status') {
        await sock.sendMessage(chatId, { text: `ℹ️ Goodbye messages are currently *${session.goodbyeEnabled ? 'enabled' : 'disabled'}*.` }, { quoted: msg });
        return;
    }

    const enabled = action === 'on';
    session.goodbyeEnabled = enabled;
    if (botData && session.userId) {
        botData.statusSettings ||= {};
        botData.statusSettings[session.userId] ||= {};
        botData.statusSettings[session.userId].goodbyeEnabled = enabled;
        if (typeof saveBotData === 'function') saveBotData();
    }

    await sock.sendMessage(
        chatId,
        { text: enabled ? '✅ Akatsuki farewell messages enabled.' : '✅ Goodbye messages disabled.' },
        { quoted: msg }
    );
};
