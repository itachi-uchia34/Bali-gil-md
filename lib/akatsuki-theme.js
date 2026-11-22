const THEME_MARKERS = /AKATSUKI|PAIN|ITACHI|TOBI|DEIDARA|SASORI|SHROUD|ALMIGHTY|SIX PATHS|BLACK RECEIVER/i;
const THEME_HEADER = '🩸 ━━━ 𝗔𝗞𝗔𝗧𝗦𝗨𝗞𝗜 • 𝗕𝗔𝗟𝗜 𝗚𝗜𝗟 𝗠𝗗 ━━━ 🩸\n\n';
const THEME_FOOTER = '\n\n⚔️ *ITACHI UCHIHA* • AKATSUKI SHROUD';
const installedSockets = new WeakSet();

function isAlreadyThemed(text) {
    const trimmed = text.trimStart();
    return trimmed.startsWith(THEME_HEADER.trimEnd())
        || trimmed.startsWith('╔')
        || trimmed.startsWith('╭━━━━━━━━━━━━━━━━━━━━━━╮')
        || trimmed.startsWith('🩸 *')
        || trimmed.startsWith('*🩸 AKATSUKI');
}

function decorateText(text) {
    if (typeof text !== 'string' || !text.trim() || isAlreadyThemed(text)) return text;
    return `${THEME_HEADER}${text}${THEME_FOOTER}`;
}

function decorateMessage(message) {
    if (!message || typeof message !== 'object') return message;
    let changed = false;
    const themedMessage = { ...message };
    for (const field of ['text', 'caption']) {
        if (typeof themedMessage[field] !== 'string') continue;
        const decorated = decorateText(themedMessage[field]);
        if (decorated !== themedMessage[field]) {
            themedMessage[field] = decorated;
            changed = true;
        }
    }
    return changed ? themedMessage : message;
}

function createThemedSocket(sock) {
    return new Proxy(sock, {
        get(target, property, receiver) {
            if (property === 'sendMessage') {
                return async (chatId, message, options) => {
                    return target.sendMessage(chatId, decorateMessage(message), options);
                };
            }

            const value = Reflect.get(target, property, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
}

function installThemedSocket(sock) {
    if (!sock || typeof sock.sendMessage !== 'function' || installedSockets.has(sock)) return sock;
    const originalSendMessage = sock.sendMessage;
    const themedSendMessage = function (chatId, message, options) {
        return originalSendMessage.call(sock, chatId, decorateMessage(message), options);
    };
    sock.sendMessage = themedSendMessage;
    if (sock.sendMessage === themedSendMessage) installedSockets.add(sock);
    return sock;
}

module.exports = { createThemedSocket, installThemedSocket, decorateText, decorateMessage, isAlreadyThemed, THEME_MARKERS, THEME_HEADER, THEME_FOOTER };
