const settings = require('../settings');
const { generateMenuText } = require('../lib/menu-text');
const { sendMenuWithSong, sendMenuText } = require('../lib/menu-format');

async function menuCommand(sock, chatId, msg, session, commands = {}, botData = {}, commandPrefix = settings.prefix) {
    const prefix = typeof commandPrefix === 'string' && commandPrefix.length ? commandPrefix : '.';
    const userName = botData?.userNames?.[session?.userId] || msg?.pushName || 'User';
    const menuText = generateMenuText(userName, session, commands, prefix);
    let delivery;
    try {
        delivery = await sendMenuWithSong(
            sock,
            chatId,
            msg,
            menuText,
            settings.startimage,
            settings.startsong,
            settings.startimageFallbacks,
            settings.startsongFallbacks
        );
    } catch (error) {
        console.warn(`Menu delivery failed before completion:`, error.message || error);
        delivery = { mode: 'text-only', menu: 'failed', song: 'failed' };
    }

    // A transient WhatsApp send failure must not leave the user with only optional media.
    if (delivery.menu !== 'sent') {
        try {
            const retry = await sendMenuText(sock, chatId, msg, menuText);
            delivery.menu = retry.menu;
        } catch (error) {
            console.warn(`Menu text retry failed:`, error.message || error);
        }
    }

    const failures = [];
    if (delivery.mode === 'text-only') failures.push('cover image');
    if (delivery.menu !== 'sent') failures.push('menu text');
    if (delivery.song !== 'sent') failures.push('menu song');

    if (failures.length) {
        await sock.sendMessage(chatId, {
            text: `⚠️ Could not deliver ${failures.join(', ')}. The remaining menu parts were still attempted; please try ${prefix}menu again.`
        }, { quoted: msg });
    }

    return delivery;
}

module.exports = menuCommand;
