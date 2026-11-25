function buildMenuFailureMessage(_commandName, prefix = '.', error) {
    const command = 'menu';
    const safePrefix = typeof prefix === 'string' && prefix ? prefix : '.';
    const detail = String(error?.message || error || 'Unknown error').slice(0, 240);
    return `⚠️ ${safePrefix}${command} could not be displayed. ${detail}\nTry ${safePrefix}help or check the bot log.`;
}

async function reportMenuFailure(sock, chatId, msg, commandName, prefix, error) {
    try {
        await sock.sendMessage(chatId, { text: buildMenuFailureMessage(commandName, prefix, error) }, { quoted: msg });
        return true;
    } catch (sendError) {
        console.error(`Could not report ${commandName} failure to chat:`, sendError.message || sendError);
        return false;
    }
}

module.exports = { buildMenuFailureMessage, reportMenuFailure };
