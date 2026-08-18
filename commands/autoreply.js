module.exports = async function autoreplyCommand(sock, chatId, msg, isAdmin, session, args = []) {
    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only the owner or an authorized admin can open the AI response gate.' }, { quoted: msg });
        return;
    }

    const action = String(args[0] || 'status').toLowerCase();
    if (action === 'on' || action === 'enable') {
        session.aiEnabled = true;
        await sock.sendMessage(chatId, {
            text: '🩸 *BALI GIL MD AUTO-REPLY: OPEN* 🩸\n\nPain’s voice will answer ordinary private messages through the Akatsuki Shroud.\n\nUse `.autoreply off` to seal the response gate.'
        }, { quoted: msg });
        return;
    }

    if (action === 'off' || action === 'disable') {
        session.aiEnabled = false;
        await sock.sendMessage(chatId, {
            text: '🔴 *BALI GIL MD AUTO-REPLY: SEALED* 🔴\n\nAutomatic private-message replies are disabled. Group autochat remains controlled separately with `.autochat`.'
        }, { quoted: msg });
        return;
    }

    await sock.sendMessage(chatId, {
        text: `🩸 *PAIN RESPONSE GATE STATUS* 🩸\n\nStatus: *${session.aiEnabled ? 'OPEN' : 'SEALED'}*\n\nUse \.autoreply on or \.autoreply off.`
    }, { quoted: msg });
};
