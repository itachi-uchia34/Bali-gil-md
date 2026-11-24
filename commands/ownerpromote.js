const settings = require('../settings');
const { normalizeJidUserId } = require('../lib/whatsapp-id');
const { normalizeConfiguredNumbers } = require('../lib/owner-access');

function send(sock, chatId, msg, text, mentions = []) {
    return sock.sendMessage(chatId, { text, ...(mentions.length ? { mentions } : {}) }, { quoted: msg });
}

function configuredPrivilegedNumbers() {
    return normalizeConfiguredNumbers(settings.ownerNumber, settings.creatorNumber);
}

function configuredPrimaryOwnerNumber() {
    return normalizeConfiguredNumbers(settings.ownerNumber)[0] || '';
}

module.exports = async function ownerpromote(sock, chatId, msg, isOwner, sender) {
    const senderJid = typeof sender === 'string'
        ? sender
        : msg?.key?.participant || msg?.key?.remoteJid || '';
    const senderNumber = normalizeJidUserId(senderJid).replace(/\D/g, '');

    // Do not rely on isOwner alone: index.js also treats the bot's own messages as owner traffic.
    if (!isOwner || !senderNumber || !configuredPrivilegedNumbers().includes(senderNumber)) {
        return send(sock, chatId, msg, '❌ This command is restricted to the configured bot owner and creator numbers.');
    }
    if (typeof chatId !== 'string' || !chatId.endsWith('@g.us')) {
        return send(sock, chatId, msg, '⚠️ Use .ownerpromote inside a group where the bot is present.');
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = Array.isArray(metadata?.participants) ? metadata.participants : [];
        const ownerNumber = configuredPrimaryOwnerNumber();
        const owner = participants.find((participant) => normalizeJidUserId(participant.id) === ownerNumber);
        if (!owner) {
            return send(sock, chatId, msg, '⚠️ The configured owner number must be a member of this group first.');
        }
        if (owner.admin === 'admin' || owner.admin === 'superadmin') {
            return send(sock, chatId, msg, 'ℹ️ The configured owner is already a group admin.');
        }

        const botNumber = normalizeJidUserId(sock.user?.id);
        const bot = participants.find((participant) => normalizeJidUserId(participant.id) === botNumber);
        if (!bot || (bot.admin !== 'admin' && bot.admin !== 'superadmin')) {
            return send(sock, chatId, msg, '⚠️ I cannot promote anyone yet. A current group admin must make the bot an admin first; WhatsApp does not allow the bot to bypass group permissions.');
        }

        await sock.groupParticipantsUpdate(chatId, [owner.id], 'promote');
        return send(sock, chatId, msg, `✅ @${ownerNumber} (the configured bot owner) was promoted to group admin.`, [owner.id]);
    } catch (error) {
        return send(sock, chatId, msg, `❌ Promotion failed: ${error.message || 'WhatsApp rejected the request.'}`);
    }
};
