module.exports = async function welcomeCommand(sock, chatId, msg, isAdmin, session, args, botData, saveBotData) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ Use `.welcome on` or `.welcome off` inside a group.' }, { quoted: msg });
        return;
    }

    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can change the welcome setting.' }, { quoted: msg });
        return;
    }

    const action = String(args[0] || '').trim().toLowerCase();
    if (!['on', 'off', 'status'].includes(action)) {
        await sock.sendMessage(chatId, { text: 'Usage: `.welcome on`, `.welcome off`, or `.welcome status`' }, { quoted: msg });
        return;
    }

    if (action === 'status') {
        await sock.sendMessage(chatId, { text: `ℹ️ Welcome messages are currently *${session.welcomeEnabled ? 'enabled' : 'disabled'}*.` }, { quoted: msg });
        return;
    }

    const enabled = action === 'on';
    session.welcomeEnabled = enabled;
    if (botData && session.userId) {
        botData.statusSettings ||= {};
        botData.statusSettings[session.userId] ||= {};
        botData.statusSettings[session.userId].welcomeEnabled = enabled;
        if (typeof saveBotData === 'function') saveBotData();
    }

    await sock.sendMessage(
        chatId,
        { text: enabled ? '✅ Welcome messages enabled for this bot session.' : '✅ Welcome messages disabled.' },
        { quoted: msg }
    );
};
