module.exports = async function tobiBanCommand(sock, chatId, msg, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ `.tobiban` can only be used inside a group.' }, { quoted: msg });
        return;
    }
    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ *TOBI’S MASKED DECREE DENIED*\nOnly group admins can send a member into the Kamui dimension.' }, { quoted: msg });
        return;
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo || {};
    const target = contextInfo.mentionedJid?.[0] || contextInfo.participant;
    if (!target) {
        await sock.sendMessage(chatId, { text: '⚠️ Tag a member or reply to their message.\nExample: `.tobiban @member`' }, { quoted: msg });
        return;
    }

    const botJid = sock.user?.id;
    if (botJid && target.split(':')[0] === botJid.split(':')[0]) {
        await sock.sendMessage(chatId, { text: '❌ Tobi cannot send the Akatsuki messenger into Kamui.' }, { quoted: msg });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, [target], 'remove');
        const mention = `@${target.split('@')[0].split(':')[0]}`;
        await sock.sendMessage(chatId, {
            text: `🌀 *━───── 🟠 TOBI’S KAMUI BAN 🟠 ─────━* 🌀\n\n` +
                `*WHOOPS... TOO LATE!*\n\n` +
                `${mention} has vanished through the mask and been removed from the group.\n` +
                `The Akatsuki’s plan continues exactly as Tobi intended.\n\n` +
                `> _"The real me... is nobody."_`,
            mentions: [target]
        }, { quoted: msg });
    } catch (error) {
        console.error('Tobi ban error:', error);
        await sock.sendMessage(chatId, { text: '❌ *KAMUI BAN FAILED*\nConfirm that the bot is a group admin and the target can be removed.' }, { quoted: msg });
    }
};
