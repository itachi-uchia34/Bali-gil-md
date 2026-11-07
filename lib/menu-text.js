const { getMenuCredits } = require('./menu-credits');

function getCommandNames(commands = {}) {
    return Object.keys(commands).filter((name) => typeof commands[name] === 'function');
}

function generateMenuText(userName, session, commands = {}, prefix = '.') {
    const safePrefix = typeof prefix === 'string' && prefix.length > 0 ? prefix : '.';
    const mode = session?.isPublic ? 'PUBLIC' : 'PRIVATE';
    const categories = {
        '🩸 AKATSUKI GROUP CONTROL': ['kick', 'ban', 'tobiban', 'add', 'promote', 'madarapromote', 'demote', 'revoke', 'mute', 'gcoff', 'unmute', 'gcon', 'tagall', 'hidetag', 'tagadmin', 'tagme', 'grouplink', 'groupinfo', 'join', 'leave', 'setdesc', 'setppgc', 'welcome', 'goodbye', 'antilink', 'kickoffline'],
        '🔴 SHADOW LEADERSHIP': ['owner', 'creator', 'public', 'private', 'mode', 'block', 'unblock', 'bcgc', 'bcall', 'restart', 'shutdown', 'xrestart', 'xshutdown', 'backup', 'restore', 'clone', 'nuke', 'deleteall', 'ghostmode', 'status'],
        '🛡️ PAIN’S SECURITY BARRIERS': ['autoreact', 'autoreacts', 'autoread', 'autostatus', 'autochat', 'anticall', 'antidelete', 'antistatus', 'antibug', 'mention', 'everyonemsg', 'listonline'],
        '🎴 SHROUD MEDIA SCROLLS': ['sticker', 'toimg', 'tomp3', 'tts', 'song', 'video', 'youtube', 'yts', 'tiktok', 'insta', 'facebook', 'pinterest', 'twitter', 'reddit', 'spotify', 'mediafire', 'mf', 'gdrive', 'apk'],
        '⚔️ SIX PATHS TOOLKIT': ['ping', 'runtime', 'uptime', 'serverinfo', 'speedtest', 'device', 'dp', 'dpz', 'vv', 'translate', 'base64', 'qr', 'shorturl', 'calc', 'weather', 'github', 'npm', 'ipinfo', 'whois', 'dnslookup', 'portscan', 'screenshot', 'define', 'google', 'wiki', 'playstore', 'tempmail', 'fakeinfo', 'binlookup'],
        '🧠 PAIN’S INTELLIGENCE NETWORK': ['ai', 'autochat', 'autoreply', 'keyword', 'keywords', 'chatbot', 'quote', 'fact', 'trivia', 'news', 'crypto', 'movie', 'lyrics', 'manga', 'quran', 'hadith', 'prayer', 'qibla', 'asmaulhusna'],
        '🎭 TOBI’S CHAOS ZONE': ['joke', 'meme', 'dare', 'truth', 'ascii', 'roast', 'compliment', 'ship', 'emojimix', 'character', 'coinflip', 'roll', 'riddle', 'wouldyourather', 'report'],
        '☁️ AKATSUKI MEMBER REGISTRY': ['akatsuki', 'painquote', 'tobiquote', 'deidaraquote', 'sasoriquote', 'artquote']
    };
    const registeredCommands = new Set(getCommandNames(commands));
    const renderSection = (title, names) => {
        const listed = [...new Set(names)].filter((name) => registeredCommands.has(name));
        if (!listed.length) return '';
        const rows = [];
        for (let i = 0; i < listed.length; i += 5) {
            rows.push(listed.slice(i, i + 5).map((name) => `${safePrefix}${name}`).join(' ┃ '));
        }
        return [`━━━━━━━━━━ ${title} ━━━━━━━━━━`, rows.join('\n'), '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'].join('\n');
    };
    const sections = Object.entries(categories)
        .map(([title, names]) => renderSection(title, names))
        .filter(Boolean);
    const listedNames = new Set(Object.values(categories).flat());
    const additional = getCommandNames(commands).filter((name) => !listedNames.has(name)).sort();
    if (additional.length) sections.push(renderSection('📜 HIDDEN SHROUD SCROLLS', additional));

    return [
        '🩸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🩸',
        '🔴 BALI GIL MD // AKATSUKI COMMAND NETWORK 🔴',
        '🩸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🩸',
        `👤 USER: ${userName || 'User'} ┃ MODE: ${mode} ┃ PREFIX: ${safePrefix}`,
        '⚔️ STATUS: ONLINE ┃ RANK: PAIN’S SIX PATHS',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        ...sections.flatMap((section) => [section, '']),
        '━━━━━━━━━━ ⚔️ QUICK ACCESS ━━━━━━━━━━',
        `${safePrefix}help ┃ ${safePrefix}h ┃ ${safePrefix}menu ┃ ${safePrefix}allmenu`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '🔴 ITACHI UCHIHA // AKATSUKI',
        ...getMenuCredits(),
        'POWERED BY ITACHI-UCHIHA ©'
    ].join('\n');
}

module.exports = { getCommandNames, generateMenuText };
