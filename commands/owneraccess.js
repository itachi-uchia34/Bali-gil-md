const settings = require('../settings');
const { normalizeConfiguredNumbers, isConfiguredOwnerNumber, getApprovedOwnerCommandNumbers } = require('../lib/owner-access');

const USAGE = 'Usage: .owneraccess grant <WhatsApp number> | revoke <number> | list';

module.exports = async function ownerAccessCommand(sock, chatId, msg, sender, args, botData, saveBotData) {
    if (!isConfiguredOwnerNumber(sender, settings.ownerNumber, settings.creatorNumber)) {
        return sock.sendMessage(chatId, { text: '❌ Only the configured Owner or Creator can approve premium access to owner commands.' }, { quoted: msg });
    }

    const action = String(args?.[0] || '').toLowerCase();
    if (action === 'list') {
        const approved = getApprovedOwnerCommandNumbers(botData);
        return sock.sendMessage(chatId, {
            text: `👑 *APPROVED OWNER-COMMAND PREMIUM USERS*\n\n${approved.length ? approved.map(number => `+${number}`).join('\n') : 'No users approved.'}`
        }, { quoted: msg });
    }

    if (!['grant', 'revoke'].includes(action) || !args?.[1]) {
        return sock.sendMessage(chatId, { text: `${USAGE}\n\nApproval grants access to owner-only commands until revoked.` }, { quoted: msg });
    }

    const numbers = normalizeConfiguredNumbers(args[1]);
    if (numbers.length !== 1) {
        return sock.sendMessage(chatId, { text: `❌ Enter one valid WhatsApp number with country code.\n${USAGE}` }, { quoted: msg });
    }

    const target = numbers[0];
    const privilegedNumbers = normalizeConfiguredNumbers(settings.ownerNumber, settings.creatorNumber);
    if (privilegedNumbers.includes(target)) {
        return sock.sendMessage(chatId, { text: 'ℹ️ Owner and Creator already have permanent access.' }, { quoted: msg });
    }

    botData.ownerCommandAccess = getApprovedOwnerCommandNumbers(botData);
    const alreadyApproved = botData.ownerCommandAccess.includes(target);
    if (action === 'grant') {
        if (alreadyApproved) {
            return sock.sendMessage(chatId, { text: `ℹ️ +${target} already has approved premium access.` }, { quoted: msg });
        }
        botData.ownerCommandAccess.push(target);
        saveBotData();
        return sock.sendMessage(chatId, { text: `✅ Premium owner-command access approved for +${target}. They can use owner-only commands until revoked.` }, { quoted: msg });
    }

    if (!alreadyApproved) {
        return sock.sendMessage(chatId, { text: `ℹ️ +${target} does not have approved owner-command access.` }, { quoted: msg });
    }
    botData.ownerCommandAccess = botData.ownerCommandAccess.filter(number => number !== target);
    saveBotData();
    return sock.sendMessage(chatId, { text: `✅ Owner-command premium access revoked for +${target}.` }, { quoted: msg });
};
