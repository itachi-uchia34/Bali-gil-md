const QUOTES = [
    'Wake up to reality. Nothing ever goes as planned in this accursed world.',
    'In this world, wherever there is light, there are also shadows.',
    'The longer you live, the more you realize that reality is just made of pain, suffering and emptiness.',
    'Hope is nothing but giving up. A word that holds no true meaning.',
    'People cannot show each other their true feelings. Fear, suspicion and resentment never subside.',
    'When a man learns to love, he must bear the risk of hatred.',
    'Under the rule of love, everything becomes peaceful.',
    'The selfish desire of wanting to maintain peace causes wars, and risk of hatred is born to protect love.',
    'Thinking of peace while spilling blood is something that only humans could do.',
    'The moment people come to know love, they run the risk of carrying hate.',
    'The longer you live, the more you understand that reality is built from choices.',
    'Even the strongest opponent has a weakness. Find it, and the battle is already decided.',
    'A dream is only a dream until someone gives it a shape.',
    'A shinobi must see beneath the surface before choosing a path.',
    'Power without purpose is only another form of emptiness.',
    'If you cannot protect what matters, your strength has no meaning.',
    'The world changes when people change what they are willing to accept.',
    'A calm mind sees the opening that anger hides.',
    'Victory belongs to the one who understands the battlefield.',
    'Only those who endure the darkness can recognize the value of light.'
];

const AUTO_DEFAULTS = {
    enabled: false,
    warning: '👁️‍🗨️ {user}, Madara has heard your call. {quote}',
    cooldownMs: 15000
};
const cooldowns = new Map();

function getConfig(botData, groupId) {
    if (!botData.madaraAutoReplies) botData.madaraAutoReplies = {};
    if (!botData.madaraAutoReplies[groupId]) botData.madaraAutoReplies[groupId] = { ...AUTO_DEFAULTS };
    const config = botData.madaraAutoReplies[groupId];
    config.enabled = Boolean(config.enabled);
    config.warning = config.warning || AUTO_DEFAULTS.warning;
    config.cooldownMs = Number(config.cooldownMs) || AUTO_DEFAULTS.cooldownMs;
    return config;
}

function chooseQuote(text = '') {
    const seed = [...text].reduce((total, char) => total + char.charCodeAt(0), 0);
    return QUOTES[seed % QUOTES.length];
}

function render(template, user, quote) {
    return template.replaceAll('{user}', `@${user.split('@')[0]}`).replaceAll('{quote}', quote);
}

function isMadaraPrompt(text = '') {
    return /\b(madara|uchiha|wake up to reality|shinobi|infinite tsukuyomi)\b/i.test(text);
}

async function madaraCommand(sock, from, msg, q) {
    const input = (q || '').trim();
    const quote = chooseQuote(input);
    const response = input
        ? `╔══〔 𝗠𝗔𝗗𝗔𝗥𝗔 𝗨𝗖𝗛𝗜𝗛𝗔 〕══╗\n\n${quote}\n\n🗡️ Your question: ${input}\n\n╚════════════════════╝`
        : `╔══〔 𝗠𝗔𝗗𝗔𝗥𝗔 𝗨𝗖𝗛𝗜𝗛𝗔 〕══╗\n\n${quote}\n\nUse .madara <your question> to consult the realm.\n\n╚════════════════════╝`;
    return sock.sendMessage(from, { text: response }, { quoted: msg });
}

async function madaraAutoCommand(sock, from, msg, isAdmin, q, botData, saveBotData) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only group admins can change Madara auto-reply settings.' }, { quoted: msg });
    const config = getConfig(botData, from);
    const args = (q || '').trim().split(/\s+/);
    const action = (args.shift() || '').toLowerCase();
    if (action === 'on' || action === 'off') {
        config.enabled = action === 'on';
        saveBotData();
        return sock.sendMessage(from, { text: `✅ Madara auto-replies ${config.enabled ? 'enabled' : 'disabled'}.` }, { quoted: msg });
    }
    if (action === 'text' && args.length) {
        const warning = args.join(' ');
        if (!warning.includes('{quote}')) return sock.sendMessage(from, { text: '⚠️ Custom auto-reply text must include {quote}.' }, { quoted: msg });
        config.warning = warning;
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Madara auto-reply template saved.' }, { quoted: msg });
    }
    if (action === 'reset') {
        config.warning = AUTO_DEFAULTS.warning;
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Madara auto-reply template reset.' }, { quoted: msg });
    }
    return sock.sendMessage(from, { text: '*Madara Auto-Reply*\n\n.madaraauto on/off\n.madaraauto text <message>\n.madaraauto reset\n\nPlaceholders: {user}, {quote}' }, { quoted: msg });
}

async function madaraConfig(sock, from, msg, isAdmin, botData) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only group admins can view Madara auto-reply settings.' }, { quoted: msg });
    const config = getConfig(botData, from);
    return sock.sendMessage(from, { text: `*Madara Auto-Reply Configuration*\n\nStatus: ${config.enabled ? '✅ ON' : '❌ OFF'}\nTemplate: ${config.warning}\nCooldown: ${config.cooldownMs / 1000}s` }, { quoted: msg });
}

async function handleAutoReply(sock, from, msg, text, sender, isGroup, isAdmin, isOwner, botData) {
    if (!isGroup || isAdmin || isOwner || !isMadaraPrompt(text)) return false;
    const config = getConfig(botData, from);
    if (!config.enabled) return false;
    const now = Date.now();
    const last = cooldowns.get(from) || 0;
    if (now - last < config.cooldownMs) return false;
    cooldowns.set(from, now);
    const quote = chooseQuote(text);
    await sock.sendMessage(from, { text: render(config.warning, sender, quote), mentions: [sender] }, { quoted: msg });
    return true;
}

module.exports = { QUOTES, getConfig, madaraCommand, madaraAutoCommand, madaraConfig, handleAutoReply, chooseQuote };
