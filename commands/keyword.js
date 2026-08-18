const KEYWORD_QUOTES = [
    { words: ['pain', 'peace'], quote: '🩸 *PAIN:* Those who do not understand pain cannot understand true peace.' },
    { words: ['akatsuki', 'shroud', 'cloak'], quote: '🩸 *AKATSUKI SHROUD:* The cloak is worn by those who walk through the darkness with purpose.' },
    { words: ['itachi', 'uchiha', 'sharingan'], quote: '🌑 *ITACHI:* Even the deepest illusion breaks before patience and sacrifice.' },
    { words: ['tobi', 'obito', 'mask'], quote: '🌀 *TOBI:* Behind every mask is a story waiting for the right moment to surface.' },
    { words: ['madara', 'rinnegan'], quote: '⚔️ *MADARA:* A battlefield becomes quiet when resolve speaks louder than fear.' },
    { words: ['deidara', 'art', 'explosion'], quote: '💥 *DEIDARA:* Art is the flash that remains after the world hears the explosion.' },
    { words: ['sasori', 'puppet'], quote: '🕷️ *SASORI:* Control the strings, understand the motion, and never surrender the stage.' }
];

function findKeywordMatch(text = '') {
    const normalized = String(text).toLowerCase();
    return KEYWORD_QUOTES.find(({ words }) => words.some((word) => {
        const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
        return pattern.test(normalized);
    }));
}

async function keywordCommand(sock, chatId, msg, isAdmin, session, args = [], botData, saveBotData, userId) {
    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Only the owner or an authorized admin can control the Akatsuki keyword gate.' }, { quoted: msg });
        return;
    }
    const action = String(args[0] || 'status').toLowerCase();
    if (action === 'on' || action === 'enable') session.keywordRepliesEnabled = true;
    else if (action === 'off' || action === 'disable') session.keywordRepliesEnabled = false;
    else if (action !== 'status') {
        await sock.sendMessage(chatId, { text: 'Use `.keyword on`, `.keyword off`, or `.keyword status`.' }, { quoted: msg });
        return;
    }

    botData.statusSettings ||= {};
    botData.statusSettings[userId] ||= {};
    botData.statusSettings[userId].keywordRepliesEnabled = session.keywordRepliesEnabled;
    if (typeof saveBotData === 'function') saveBotData();
    await sock.sendMessage(chatId, {
        text: `🩸 *AKATSUKI KEYWORD GATE* 🩸\n\nStatus: *${session.keywordRepliesEnabled ? 'OPEN' : 'SEALED'}*\nTriggers: Pain • Itachi • Tobi • Madara • Deidara • Sasori\n\nUse \.keyword on or \.keyword off.`
    }, { quoted: msg });
}

keywordCommand.findMatch = findKeywordMatch;
keywordCommand.quotes = KEYWORD_QUOTES;
module.exports = keywordCommand;
