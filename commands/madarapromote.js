module.exports = async function madaraPromoteCommand(sock, chatId, msg, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ `.madarapromote` can only be used inside a group.' }, { quoted: msg });
        return;
    }
    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ *MADARA’S DECREE DENIED*\nOnly group admins can awaken a new commander.' }, { quoted: msg });
        return;
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo || {};
    const targets = contextInfo.mentionedJid?.length ? contextInfo.mentionedJid :
        (contextInfo.participant ? [contextInfo.participant] : []);
    if (!targets.length) {
        await sock.sendMessage(chatId, { text: '⚠️ Tag a member or reply to their message.\nExample: `.madarapromote @member`' }, { quoted: msg });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, targets, 'promote');
        const mentions = targets.map((jid) => `@${jid.split('@')[0].split(':')[0]}`).join(' ');
        await sock.sendMessage(chatId, {
            text: `🔥 *━───── 🔴 MADARA’S WAR COUNCIL 🔴 ─────━* 🔥\n\n` +
                `*THE AGE OF THE SHINOBI WORLD BEGINS!*\n\n` +
                `${mentions} ${targets.length === 1 ? 'has' : 'have'} been raised to commander rank.\n` +
                `Under Madara’s authority, lead without hesitation and defend the Shroud.\n\n` +
                `> _"In this world, wherever there is light, there are also shadows."_`,
            mentions: targets
        }, { quoted: msg });
    } catch (error) {
        console.error('Madara promote error:', error);
        await sock.sendMessage(chatId, { text: '❌ *WAR COUNCIL PROMOTION FAILED*\nConfirm that the bot is a group admin and the target can be promoted.' }, { quoted: msg });
    }
};
