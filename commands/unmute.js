const { sendGroupModeResponse } = require('../lib/group-mode-response');
const settings = require('../settings');

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
        await sendGroupModeResponse(sock, chatId, msg, true, {
            soundUrl: settings.gconSound,
            soundFallbacks: settings.gconSoundFallbacks
        });
    } catch (error) {
        console.error('Pain shroud release error:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *SHROUD RELEASE FAILED*\nConfirm that the bot is a group admin and that WhatsApp allows group settings to be changed.'
        }, { quoted: msg });
    }
};
