module.exports = async function promoteCommand(sock, chatId, msg, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚠️ `.promote` can only be used inside a group.' }, { quoted: msg });
        return;
    }
    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only group admins can grant Akatsuki ranks.' }, { quoted: msg });
        return;
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    const targets = contextInfo.mentionedJid?.length ? contextInfo.mentionedJid :
        (contextInfo.participant ? [contextInfo.participant] : []);
    if (!targets.length) {
        await sock.sendMessage(chatId, { text: '⚠️ Tag a member or reply to their message.\nExample: `.promote @member`' }, { quoted: msg });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, targets, 'promote');
        const mentions = targets.map((jid) => `@${jid.split('@')[0].split(':')[0]}`).join(' ');
        await sock.sendMessage(chatId, {
            text: `🩸 *━───── 🔴 AKATSUKI RANKS 🔴 ─────━* 🩸\n\n` +
                `⚔️ The Shroud recognizes a new commander.\n\n` +
                `${mentions} ${targets.length === 1 ? 'has' : 'have'} been elevated to Akatsuki leadership.\n` +
                `Lead with discipline and protect the organization.`,
            mentions: targets
        }, { quoted: msg });
    } catch (error) {
        console.error('Akatsuki promote error:', error);
        await sock.sendMessage(chatId, { text: '❌ Promotion failed. Confirm that the bot is a group admin and the target can be promoted.' }, { quoted: msg });
    }
};
