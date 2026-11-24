const THEME_MARKERS = /AKATSUKI|PAIN|ITACHI|TOBI|DEIDARA|SASORI|SHROUD|ALMIGHTY|SIX PATHS|BLACK RECEIVER/i;
const THEME_HEADER = '🩸 ╔══════ ⟦ 𝗕𝗔𝗟𝗜 𝗚𝗜𝗟 𝗠𝗗 ⟧ ══════╗ 🩸\n\n';
const THEME_FOOTER = '\n\n⚡ ══════ 𝗜𝗧𝗔𝗖𝗛𝗜 𝗨𝗖𝗛𝗜𝗛𝗔 • 𝗔𝗞𝗔𝗧𝗦𝗨𝗞𝗜 𝗦𝗛𝗥𝗢𝗨𝗗 ══════ ⚡';
const installedSockets = new WeakSet();
const protectedTokens = /(\x60\x60\x60[\s\S]*?\x60\x60\x60|\x60[^\x60\n]*\x60|https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|[A-Za-z0-9_+/=-]{16,}|[.!#\/][A-Za-z][A-Za-z0-9_-]*)/g;

function toSansBoldLetters(value) {
    return Array.from(value, (char) => {
        const code = char.codePointAt(0);
        if (char >= 'A' && char <= 'Z') return String.fromCodePoint(0x1D5D4 + code - 65);
        if (char >= 'a' && char <= 'z') return String.fromCodePoint(0x1D5EE + code - 97);
        return char;
    }).join('');
}

function stylizeBotText(text) {
    return String(text).split(protectedTokens).map((part) => {
        if (!part) return part;
        if (/^```|^`|^https?:\/\/|^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$|^[A-Za-z0-9_+/=-]{16,}$|^[.!#\/][A-Za-z][A-Za-z0-9_-]*$/.test(part)) return part;
        return toSansBoldLetters(part);
    }).join('');
}

function getMessageAccent(text) {
    const trimmed = String(text).trimStart();
    if (/^\p{Extended_Pictographic}/u.test(trimmed)) return '';
    if (/^(?:error|failed|invalid|could not|unable|denied|forbidden)\b/i.test(trimmed)) return '🚫 ';
    if (/^(?:success|done|saved|enabled|connected|promoted|completed|welcome)\b/i.test(trimmed)) return '✅ ';
    return '🌀 ';
}

function isAlreadyThemed(text) {
    const trimmed = text.trimStart();
    return trimmed.startsWith(THEME_HEADER.trimEnd())
        || trimmed.startsWith('╔')
        || trimmed.startsWith('╭━━━━━━━━━━━━━━━━━━━━━━╮')
        || trimmed.startsWith('🩸 *')
        || trimmed.startsWith('*🩸 AKATSUKI');
}

function decorateText(text) {
    if (typeof text !== 'string' || !text.trim()) return text;
    const styledText = stylizeBotText(text);
    if (isAlreadyThemed(text)) return styledText;
    return `${THEME_HEADER}${getMessageAccent(text)}${styledText}${THEME_FOOTER}`;
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

module.exports = { createThemedSocket, installThemedSocket, decorateText, decorateMessage, stylizeBotText, getMessageAccent, isAlreadyThemed, THEME_MARKERS, THEME_HEADER, THEME_FOOTER };
