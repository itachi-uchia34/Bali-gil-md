const THEME_MARKERS = /AKATSUKI|PAIN|ITACHI|TOBI|DEIDARA|SASORI|SHROUD|ALMIGHTY|SIX PATHS|BLACK RECEIVER/i;
const THEME_HEADER = '🩸 *BALI GIL* 🩸\n\n';

function decorateText(text) {
    if (typeof text !== 'string' || !text.trim() || THEME_MARKERS.test(text)) return text;
    return `${THEME_HEADER}${text}`;
}

function createThemedSocket(sock) {
    return new Proxy(sock, {
        get(target, property, receiver) {
            if (property === 'sendMessage') {
                return async (chatId, message, options) => {
                    if (message && typeof message === 'object' && typeof message.text === 'string') {
                        message = { ...message, text: decorateText(message.text) };
                    }
                    return target.sendMessage(chatId, message, options);
                };
            }

            const value = Reflect.get(target, property, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
}

module.exports = { createThemedSocket, decorateText, THEME_MARKERS };
