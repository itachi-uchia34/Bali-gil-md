const settings = require('../settings');

async function ownerCommand(sock, from, msg) {
    const ownerNumber = String(settings.ownerNumber || '').split(',').map(value => `+${value.replace(/\D/g, '')}`).join(', ');
    const creatorNumber = String(settings.creatorNumber || '').split(',').map(value => `+${value.replace(/\D/g, '')}`).join(', ');
    const ownerText = `👤 *BOT OWNER:* ${settings.ownerName}\n` +
                    `📱 *OWNER NUMBER:* ${ownerNumber}\n\n` +
                    `🛠️ *CREATOR:* ${settings.creatorName || settings.developerName}\n` +
                    `📱 *CREATOR NUMBER:* ${creatorNumber}\n\n` +
                    `🔗 *OFFICIAL WHATSAPP CHANNEL:*\n` +
                    `> *${settings.whatsappChannel}*`;
    await sock.sendMessage(from, { text: ownerText }, { quoted: msg });
}

module.exports = ownerCommand;
