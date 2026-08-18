module.exports = async function demoteCommand(sock, chatId, msg, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ `.demote` can only be used inside a group.' }, { quoted: msg });
        return;
    }
    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can revoke Akatsuki ranks.' }, { quoted: msg });
        return;
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    const targets = contextInfo.mentionedJid?.length ? contextInfo.mentionedJid :
        (contextInfo.participant ? [contextInfo.participant] : []);
    if (!targets.length) {
        await sock.sendMessage(chatId, { text: '⚠️ Tag an admin or reply to their message.\nExample: `.demote @member`' }, { quoted: msg });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, targets, 'demote');
        const mentions = targets.map((jid) => `@${jid.split('@')[0].split(':')[0]}`).join(' ');
        await sock.sendMessage(chatId, {
            text: `🩸 *━───── 🔴 AKATSUKI RANKS 🔴 ─────━* 🩸\n\n` +
                `⚔️ The Shroud has revoked a commander's rank.\n\n` +
                `${mentions} ${targets.length === 1 ? 'has' : 'have'} been returned to the ranks.\n` +
                `The organization continues under disciplined leadership.`,
            mentions: targets
        }, { quoted: msg });
    } catch (error) {
        console.error('Akatsuki demote error:', error);
        await sock.sendMessage(chatId, { text: '❌ Demotion failed. Confirm that the bot is a group admin and the target can be demoted.' }, { quoted: msg });
    }
};
