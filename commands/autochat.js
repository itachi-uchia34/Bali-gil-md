module.exports = async function autochatCommand(sock, chatId, msg, isAdmin, session, args = [], botData, saveBotData) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ `.autochat` can only be used inside a group.' }, { quoted: msg });
        return;
    }

    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can open the Pain AI Shroud.' }, { quoted: msg });
        return;
    }

    session.autochatGroups ||= {};
    const action = String(args[0] || 'status').toLowerCase();
    const enabled = Boolean(session.autochatGroups[chatId]);

    if (action === 'on' || action === 'enable') {
        session.autochatGroups[chatId] = true;
        botData.statusSettings[session.userId] ||= {};
        botData.statusSettings[session.userId].autochatGroups = session.autochatGroups;
        saveBotData();
        await sock.sendMessage(chatId, {
            text: '🩸 *PAIN’S AI SHROUD: OPEN* 🩸\n\nThe Six Paths will answer ordinary group messages with AI replies.\n\nUse `.autochat off` to close the Shroud.\n⚔️ Keep the command enabled only where conversation is wanted.'
        }, { quoted: msg });
        return;
    }

    if (action === 'off' || action === 'disable') {
        delete session.autochatGroups[chatId];
        botData.statusSettings[session.userId] ||= {};
        botData.statusSettings[session.userId].autochatGroups = session.autochatGroups;
        saveBotData();
        await sock.sendMessage(chatId, {
            text: '🔴 *PAIN’S AI SHROUD: SEALED* 🔴\n\nThe bot will remain silent unless a command or direct AI request is used.'
        }, { quoted: msg });
        return;
    }

    await sock.sendMessage(chatId, {
        text: `🩸 *PAIN AI SHROUD STATUS* 🩸\n\nStatus: *${enabled ? 'OPEN' : 'SEALED'}*\n\nUse \.autochat on or \.autochat off.`
    }, { quoted: msg });
};
