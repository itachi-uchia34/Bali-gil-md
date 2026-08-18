const settings = require('../settings');

async function ownerCommand(sock, from, msg) {
    const ownerName = settings.ownerName || 'BALI GIL';
    const ownerNumber = String(settings.ownerNumber || '').replace(/\D/g, '');
    const ownerText = `🩸 *━───── 🔴 BALI GIL 🔴 ─────━* 🩸\n\n` +
        `*☠️ SHROUD ARCHITECT ☠️*\n\n` +
        `👤 *CREATOR:* ${ownerName}\n` +
        `📱 *CONTACT:* ${ownerNumber ? `+${ownerNumber}` : 'Not configured'}\n` +
        `⚔️ *TITLE:* Keeper of the Akatsuki Command Center\n\n` +
        `🔗 *OFFICIAL WHATSAPP CHANNEL:*\n` +
        `> *https://whatsapp.com/channel/0029Vb8RIvDHVvTgHqEiRY1N*\n\n` +
        `> _"Those who break the rules are scum, but those who abandon their comrades are worse than scum."_\n\n` +
        `🩸 Honor the cloak. Follow the dynamic.`;

    await sock.sendMessage(from, { text: ownerText }, { quoted: msg });
}

module.exports = ownerCommand;
