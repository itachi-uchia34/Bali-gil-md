module.exports = async function banCommand(sock, chatId, msg, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ `.kick` and `.ban` can only be used inside a group.' }, { quoted: msg });
        return;
    }

    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can issue an Akatsuki removal order.' }, { quoted: msg });
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
        await sock.sendMessage(chatId, { text: '❌ The Akatsuki cannot remove itself.' }, { quoted: msg });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, [target], 'remove');
        const mention = `@${target.split('@')[0].split(':')[0]}`;
        await sock.sendMessage(chatId, {
            text: `🩸 *━───── 🔴 AKATSUKI JUDGMENT 🔴 ─────━* 🩸\n\n` +
                `⚔️ The Shroud has passed its judgment.\n\n` +
                `${mention} has been expelled from the organization.\n` +
                `The cloak is withdrawn, and the ranks move forward.\n\n` +
                `> _"Those who do not understand true pain can never understand true peace."_`,
            mentions: [target]
        }, { quoted: msg });
    } catch (error) {
        console.error('Akatsuki removal error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ The removal order failed. Confirm that the bot is a group admin and that the target is removable.'
        }, { quoted: msg });
    }
};
