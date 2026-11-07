const AUTO_REACT_EMOJIS = Object.freeze([
    '❤️', '👍', '🔥', '👏', '😮', '😂', '🙌', '✨', '⭐', '✅',
    '🤖', '⚡', '🌟', '💯', '🌈', '💎', '👑', '🎉', '🧿', '🍀'
]);

function nextAutoReactEmoji(session) {
    if (!session || typeof session !== 'object') throw new TypeError('A bot session is required');
    const currentIndex = Number.isInteger(session.autoReactIndex) && session.autoReactIndex >= 0
        ? session.autoReactIndex % AUTO_REACT_EMOJIS.length
        : 0;
    session.autoReactIndex = (currentIndex + 1) % AUTO_REACT_EMOJIS.length;
    return AUTO_REACT_EMOJIS[currentIndex];
}

function getAutoReactEmojiList() {
    return AUTO_REACT_EMOJIS.join(' ');
}

module.exports = { AUTO_REACT_EMOJIS, nextAutoReactEmoji, getAutoReactEmojiList };
