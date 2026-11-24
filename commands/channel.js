const CHANNEL_URL = /^https:\/\/whatsapp\.com\/channel\/[A-Za-z0-9_-]+$/i;
const CHANNEL_JID = /^\d+(?:-\d+)?@newsletter$/i;

function parseChannel(value = '') {
    const channel = String(value).trim();
    if (CHANNEL_URL.test(channel)) return { jid: channel, display: channel, url: channel };
    if (CHANNEL_JID.test(channel)) return { jid: channel, display: channel, url: '' };
    return null;
}

function channelSettingsText(channel) {
    const current = channel?.jid || 'Default repository channel';
    return `╔══〔 📡 𝗠𝗔𝗗𝗔𝗥𝗔 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 〕══╗\n\n📍 *Menu channel:* ${current}\n\nOwner commands:\n.setchannel <channel-jid-or-url>\n.channel\n.removechannel\n\nAccepted examples:\n120363123456789012@newsletter\nhttps://whatsapp.com/channel/YourInviteCode\n\nThe configured channel is shown in every .menu response.\n\n╚════════════════════╝`;
}

async function setChannelCommand(sock, from, msg, isOwner, q, botData, saveBotData, userId) {
    if (!isOwner) return sock.sendMessage(from, { text: '❌ Only the bot owner can change the menu channel.' }, { quoted: msg });
    const parsed = parseChannel(q);
    if (!parsed) return sock.sendMessage(from, { text: '⚠️ Invalid channel identifier. Use a channel JID ending in `@newsletter` or an official `https://whatsapp.com/channel/...` URL.' }, { quoted: msg });
    if (!botData.channelSettings) botData.channelSettings = {};
    botData.channelSettings[userId] = parsed;
    saveBotData();
    return sock.sendMessage(from, { text: `✅ Menu channel saved.\n\n📡 ${parsed.jid}\n\nRun .menu to display it.` }, { quoted: msg });
}

async function channelCommand(sock, from, msg, isOwner, botData, userId) {
    const channel = botData.channelSettings?.[userId];
    return sock.sendMessage(from, { text: channelSettingsText(channel) }, { quoted: msg });
}

async function removeChannelCommand(sock, from, msg, isOwner, botData, saveBotData, userId) {
    if (!isOwner) return sock.sendMessage(from, { text: '❌ Only the bot owner can remove the menu channel.' }, { quoted: msg });
    if (botData.channelSettings) delete botData.channelSettings[userId];
    saveBotData();
    return sock.sendMessage(from, { text: '✅ Custom menu channel removed. The default repository channel is active again.' }, { quoted: msg });
}

module.exports = { setChannelCommand, channelCommand, removeChannelCommand, parseChannel, channelSettingsText };
