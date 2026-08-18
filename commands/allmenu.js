const { formatFramedMenu, sendFramedMenu } = require('../lib/menu-format');
const settings = require('../settings');

async function allMenu(sock, from, msg, session, commands, pluginCommandNames = []) {
    const categories = {
        '👑 SHADOW LEADERSHIP': ['public', 'private', 'mode', 'owner', 'setname', 'block', 'unblock', 'bcgc', 'bcall', 'restart', 'shutdown', 'xrestart', 'xshutdown', 'nuke', 'clear', 'backup', 'restore', 'clone', 'addsudo', 'delsudo', 'listsudo', 'setprefix', 'broadcast', 'self', 'autostatus', 'autoseen', 'autolike', 'autobio'],
        '🩸 AKATSUKI GROUP CONTROL': ['kick', 'ban', 'tobiban', 'add', 'promote', 'madarapromote', 'demote', 'mute', 'gcoff', 'unmute', 'gcon', 'tagall', 'hidetag', 'grouplink', 'groupinfo', 'join', 'leave', 'setdesc', 'setppgc', 'getbio', 'getdp', 'accept', 'poll', 'everyonemsg', 'listonline', 'tagme', 'mention', 'kickoffline', 'snipe', 'editmsg', 'react', 'send', 'forward', 'save', 'welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'antilink', 'antidelete', 'antiviewonce', 'antifake', 'antispam', 'antibug', 'anticall', 'antistatus'],
        '⚔️ KAGE VILLAGE RIVALRY': ['kage', 'kagerivalry'],
        '🧠 PAIN’S INTELLIGENCE NETWORK': ['ai', 'autochat', 'autoreply', 'keyword', 'keywords', 'chatbot', 'gali', 'chatgpt', 'gemini', 'llama', 'deepseek', 'flux', 'pixart', 'dalle', 'bingai', 'blackbox', 'imagine', 'midjourney', 'simi', 'brainly', 'math'],
        '🎴 SHROUD DOWNLOAD SCROLLS': ['song', 'video', 'insta', 'tiktok', 'facebook', 'youtube', 'pinterest', 'twitter', 'reddit', 'spotify', 'mf', 'apk', 'gdrive', 'ytdl', 'ytmp3', 'ytmp4', 'gitclone', 'threads', 'snapchat', 'capcut', 'terabox'],
        '⚔️ SIX PATHS TOOLKIT': ['ping', 'dp', 'vv', 'translate', 'base64', 'qr', 'shorturl', 'calc', 'weather', 'github', 'ipinfo', 'tempmail', 'fakeinfo', 'binlookup', 'whois', 'dnslookup', 'portscan', 'screenshot', 'define', 'google', 'wiki', 'yts', 'playstore', 'npm', 'sticker', 'toimg', 'tomp3', 'tts', 'blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge', 'runtime', 'uptime', 'serverinfo', 'speedtest', 'device', 'pdf', 'ocr', 'remini', 'enhance', 'upscale', 'find', 'location', 'time', 'search'],
        '🎭 TOBI’S CHAOS ZONE': ['joke', 'meme', 'dare', 'truth', 'ascii', 'roast', 'compliment', 'ship', 'emojimix', 'character', 'quote', 'fact', 'trivia', 'coinflip', 'roll', 'riddle', 'wouldyourather', 'hack', 'report', 'spam', 'smsbomb', 'callbomb', 'crash', 'freeze', 'lag', 'bug', 'locspam', 'vcardspam', 'buttonspam', 'pollspam', 'contactspam', 'flirt', 'insult', 'pickup', 'dare', 'truth', 'tictactoe', '8ball', 'chess', 'hangman'],
        '🕌 KNOWLEDGE SCROLLS': ['quran', 'hadith', 'prayer', 'qibla', 'asmaulhusna', 'surah', 'ayat', 'tafsir', 'dua', 'azkar'],
        '☁️ AKATSUKI ANIME REGISTRY': ['anime', 'manga', 'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'slap', 'kill', 'happy', 'wink', 'poke', 'dance', 'cringe'],
        '🏢 SHROUD LOGO FORGE': ['neon', 'glitch', 'gold', '3dtext', 'fire', 'water', 'galaxy', 'marvel', 'avengers', 'transformer', 'blackpink', 'gradient', 'luxury', 'royal', 'metal', 'steel', 'chrome', 'glossy'],
        '✏️ AKATSUKI TEXT MAKER': ['bali', 'cup', 'coffee', 'cloud', 'smoke', 'flower', 'leaf', 'wood', 'stone', 'blood', 'horror', 'scary', 'spooky', 'christmas', 'birthday', 'love', 'heart']
    };
    if (pluginCommandNames.length > 0) categories['🩸 AKATSUKI PLUGINS'] = pluginCommandNames;

    const registered = new Set(Object.keys(commands));
    const pluginNames = new Set(pluginCommandNames);
    const sections = Object.entries(categories).map(([title, names]) => ({
        title,
        commands: names.filter((name) => registered.has(name) || pluginNames.has(name)).map((name) => `.${name}`)
    })).filter((section) => section.commands.length);

    const listed = new Set(Object.values(categories).flat());
    const additional = Object.keys(commands).filter((name) => !listed.has(name)).sort();
    if (additional.length) sections.push({ title: '📜 HIDDEN SHROUD SCROLLS', commands: additional.map((name) => `.${name}`) });

    const allMenuText = formatFramedMenu({
        title: 'BALI GIL MD ALL MENU',
        subtitle: `COMPLETE AKATSUKI COMMAND INDEX // ${registered.size} REGISTERED`,
        sections
    });
    await sendFramedMenu(sock, from, msg, allMenuText, settings.startimage, settings.startimageFallbacks);
}

module.exports = allMenu;
