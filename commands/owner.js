const settings = require('../settings');

function formatPhoneNumbers(value) {
    return String(value || '')
        .split(',')
        .map(number => number.replace(/\D/g, ''))
        .filter(Boolean)
        .map(number => `+${number}`);
}

async function ownerCommand(sock, from, msg) {
    const ownerNumbers = formatPhoneNumbers(settings.ownerNumber);
    const creatorNumbers = formatPhoneNumbers(settings.creatorNumber);
    const creatorDigits = creatorNumbers[0]?.replace(/\D/g, '');
    const creatorContact = creatorDigits ? `https://wa.me/${creatorDigits}` : 'Creator contact is not configured';
    const creatorName = settings.creatorName || settings.developerName || 'Creator';
    const requestText = `Assalam-o-Alaikum ${creatorName}, I would like to request premium access for my WhatsApp number.`;
    const requestLink = creatorDigits
        ? `https://wa.me/${creatorDigits}?text=${encodeURIComponent(requestText)}`
        : creatorContact;

    const ownerText = `👤 *BOT OWNER:* ${settings.ownerName}\n` +
        `📱 *OWNER NUMBER:* ${ownerNumbers.join(', ') || 'Not configured'}\n\n` +
        `🛠️ *CREATOR:* ${creatorName}\n` +
        `📱 *CREATOR NUMBER:* ${creatorNumbers.join(', ') || 'Not configured'}\n` +
        `💬 *CREATOR CONTACT:* ${creatorContact}\n\n` +
        `💎 *PREMIUM ACCESS REQUEST*\n` +
        `Want access to owner-only commands? Contact the Creator and send a premium request.\n` +
        `📝 *Suggested message:* “${requestText}”\n` +
        `🔗 *REQUEST PREMIUM:* ${requestLink}\n` +
        `✅ Access is enabled only after the Creator/Owner approves your number.\n\n` +
        `🔗 *OFFICIAL WHATSAPP CHANNEL:*\n` +
        `> *${settings.whatsappChannel}*`;

    await sock.sendMessage(from, { text: ownerText }, { quoted: msg });
}

module.exports = ownerCommand;
