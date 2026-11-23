const AUTO_REACT_EMOJIS = Object.freeze([
    // Hearts and affection
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    // Faces and expressions
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🤓', '🧐', '🤔', '🫡', '🥳', '🤩', '😺', '😸', '😹', '😻', '😽',
    // Hands, gestures, and reactions
    '👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🫶', '🫰', '👋', '🖐️', '✋',
    // Akatsuki and power
    '🩸', '🌀', '☁️', '🌑', '⚔️', '💀', '🔥', '✨', '⭐', '🌟', '💯', '⚡', '💥', '💎', '👑', '🎯', '🧿', '✅', '✔️', '❌', '🚀', '🌈', '🍀', '🌙', '☀️', '💫', '🔮', '🪄',
    // Celebration, music, and objects
    '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎵', '🎶', '🎤', '📸', '💡', '🔔', '💌', '🧸', '🪷', '🪭',
    // Animals and nature
    '🐱', '🐶', '🐼', '🦊', '🐸', '🐵', '🦁', '🐯', '🐰', '🐻', '🐨', '🐧', '🦄', '🦋', '🐢', '🐬', '🦉', '🌸', '🌺', '🌷', '🌻', '🌹', '🌿', '🍁', '🌊', '🌳',
    // Food and fun
    '🍕', '🍰', '🍓', '🍉', '🍩', '🍪', '🍫', '🍿', '☕', '🧋', '🥑', '🍜', '🍒', '🍇', '🍍', '🧁'
]);
const AUTO_REACT_EMOJI_SET = new Set(AUTO_REACT_EMOJIS);

function shuffleEmojiCycle(previousEmoji) {
    const shuffled = [...AUTO_REACT_EMOJIS];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Avoid an identical reaction at the boundary between two complete cycles.
    if (shuffled.length > 1 && shuffled[0] === previousEmoji) {
        const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1));
        [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
    }
    return shuffled;
}

function isValidEmojiCycle(cycle) {
    return Array.isArray(cycle) &&
        cycle.length === AUTO_REACT_EMOJIS.length &&
        new Set(cycle).size === AUTO_REACT_EMOJIS.length &&
        cycle.every((emoji) => AUTO_REACT_EMOJI_SET.has(emoji));
}

function nextAutoReactEmoji(session) {
    if (!session || typeof session !== 'object') throw new TypeError('A bot session is required');

    let cycle = session.autoReactCycle;
    let index = session.autoReactIndex;
    if (!isValidEmojiCycle(cycle) || !Number.isInteger(index) || index < 0 || index >= cycle.length) {
        cycle = shuffleEmojiCycle(session.autoReactLastEmoji);
        index = 0;
    }

    const emoji = cycle[index];
    session.autoReactCycle = cycle;
    session.autoReactIndex = index + 1;
    session.autoReactLastEmoji = emoji;
    return emoji;
}

function getAutoReactEmojiList() {
    const lines = [];
    for (let i = 0; i < AUTO_REACT_EMOJIS.length; i += 12) {
        lines.push(AUTO_REACT_EMOJIS.slice(i, i + 12).join(' '));
    }
    return lines.join('\n');
}

module.exports = { AUTO_REACT_EMOJIS, nextAutoReactEmoji, getAutoReactEmojiList };
