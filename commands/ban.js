module.exports = async function banCommand(sock, chatId, msg, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ `.kick` and `.ban` can only be used inside a group.' }, { quoted: msg });
        return;
    }

    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ *PAIN’S DECREE DENIED*\nOnly group admins can invoke Almighty Push.' }, { quoted: msg });
        return;
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo || {};
    const target = contextInfo.mentionedJid?.[0] || contextInfo.participant;

    if (!target) {
        await sock.sendMessage(chatId, {
            text: '⚠️ Reply to a member’s message or tag them.\nExample: `.ban @member`'
        }, { quoted: msg });
        return;
    }

    const botJid = sock.user?.id;
    if (botJid && target.split(':')[0] === botJid.split(':')[0]) {
        await sock.sendMessage(chatId, { text: '❌ Even Almighty Push cannot target the Akatsuki itself.' }, { quoted: msg });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, [target], 'remove');
        const mention = `@${target.split('@')[0].split(':')[0]}`;
        await sock.sendMessage(chatId, {
            text: `🩸 *━───── 🔴 PAIN’S ALMIGHTY PUSH 🔴 ─────━* 🩸\n\n` +
                `🌀 *SHINRA TENSEI!*\n\n` +
                `${mention} has been repelled from the Shroud.\n` +
                `The Six Paths have delivered judgment, and the organization remains in balance.\n\n` +
                `> _"Those who do not understand true pain can never understand true peace."_`,
            mentions: [target]
        }, { quoted: msg });
    } catch (error) {
        console.error('Pain Almighty Push ban error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *ALMIGHTY PUSH FAILED*\nConfirm that the bot is a group admin and that the target can be removed.'
        }, { quoted: msg });
    }
};
