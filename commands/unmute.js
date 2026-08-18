module.exports = async function unmuteCommand(sock, chatId, msg, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: '⚠️ `.unmute` and `.gcon` can only be used inside a group.'
        }, { quoted: msg });
        return;
    }

    if (!isAdmin) {
        await sock.sendMessage(chatId, {
            text: '❌ *PAIN’S DECREE DENIED*\nOnly group admins can release the Silent Shroud.'
        }, { quoted: msg });
        return;
    }

    try {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        await sock.sendMessage(chatId, {
            text: `🩸 *━───── 🔴 PAIN’S SHROUD RELEASED 🔴 ─────━* 🩸\n\n` +
                `🌀 *ALL PATHS RECONNECTED*\n\n` +
                `The group is open again. Every member may speak, while the Six Paths return to watchful silence.\n\n` +
                `> _"Peace is not something that can be given. It must be understood."_\n\n` +
                `Use *.gcoff* or *.mute* to invoke Almighty Silence again.`,
        }, { quoted: msg });
    } catch (error) {
        console.error('Pain shroud release error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *SHROUD RELEASE FAILED*\nConfirm that the bot is a group admin and that WhatsApp allows group settings to be changed.'
        }, { quoted: msg });
    }
};
