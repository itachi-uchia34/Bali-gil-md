const THEME_MARKERS = /AKATSUKI|PAIN|ITACHI|TOBI|DEIDARA|SASORI|SHROUD|ALMIGHTY|SIX PATHS|BLACK RECEIVER/i;
const THEME_HEADER = '🩸 ━━━ 𝗔𝗞𝗔𝗧𝗦𝗨𝗞𝗜 • 𝗕𝗔𝗟𝗜 𝗚𝗜𝗟 𝗠𝗗 ━━━ 🩸\n\n';
const THEME_FOOTER = '\n\n⚔️ *ITACHI UCHIHA* • AKATSUKI SHROUD';

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

function createThemedSocket(sock) {
    return new Proxy(sock, {
        get(target, property, receiver) {
            if (property === 'sendMessage') {
                return async (chatId, message, options) => {
                    if (message && typeof message === 'object') {
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
                        if (changed) message = themedMessage;
                    }
                    return target.sendMessage(chatId, message, options);
                };
            }

            const value = Reflect.get(target, property, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
}

module.exports = { createThemedSocket, decorateText, isAlreadyThemed, THEME_MARKERS, THEME_HEADER, THEME_FOOTER };
