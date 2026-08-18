module.exports = async function muteCommand(sock, chatId, msg, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: '⚠️ `.mute` can only be used inside a group.'
        }, { quoted: msg });
        return;
    }

    if (!isAdmin) {
        await sock.sendMessage(chatId, {
            text: '❌ *PAIN’S DECREE DENIED*\nOnly group admins can seal the Shroud with the Six Paths.'
        }, { quoted: msg });
        return;
    }

    try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        await sock.sendMessage(chatId, {
            text: `🩸 *━───── 🔴 PAIN’S SILENT SHROUD 🔴 ─────━* 🩸\n\n` +
                `🌀 *BLACK RECEIVER SEAL ACTIVATED*\n\n` +
                `The group has entered *Almighty Silence*.\n` +
                `Only admins may speak while the Six Paths observe.\n\n` +
                `> _"Feel pain. Contemplate pain. Accept pain."_\n\n` +
                `Use *.unmute* to restore the voices of the organization.`,
        }, { quoted: msg });
    } catch (error) {
        console.error('Pain silent shroud mute error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *SILENT SHROUD FAILED*\nConfirm that the bot is a group admin and that WhatsApp allows group settings to be changed.'
        }, { quoted: msg });
    }
};
