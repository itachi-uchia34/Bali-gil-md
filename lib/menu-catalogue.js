const MENU_CATEGORIES = {
    '👑 SHADOW LEADERSHIP': ['public', 'private', 'mode', 'owner', 'ownerpromote', 'setname', 'block', 'unblock', 'bcgc', 'bcall', 'restart', 'shutdown', 'xrestart', 'xshutdown', 'nuke', 'backup', 'restore', 'clone', 'addsudo', 'delsudo', 'listsudo', 'setprefix', 'broadcast', 'self', 'autostatus', 'autoseen', 'autolike', 'autobio'],
    '🩸 AKATSUKI GROUP CONTROL': ['kick', 'ban', 'tobiban', 'unban', 'add', 'promote', 'madarapromote', 'demote', 'revoke', 'mute', 'gcoff', 'unmute', 'gcon', 'tagall', 'hidetag', 'tagadmin', 'grouplink', 'groupinfo', 'groupname', 'groupopen', 'groupclose', 'groupstats', 'admins', 'members', 'allmembers', 'adminsonly', 'groupid', 'grouphelp', 'revokeinvite', 'join', 'leave', 'setdesc', 'setppgc', 'getbio', 'getdp', 'accept', 'poll', 'everyonemsg', 'listonline', 'tagme', 'mention', 'kickoffline', 'snipe', 'editmsg', 'react', 'send', 'forward', 'save', 'welcome', 'goodbye', 'welcomeconfig', 'setwelcome', 'setgoodbye', 'antilink', 'antidelete', 'antiviewonce', 'antifake', 'antispam', 'antibug', 'anticall', 'antistatus', 'moderationconfig', 'antilinkwarn', 'antispamwarn'],
    '⚔️ KAGE VILLAGE RIVALRY': ['kage', 'kagerivalry'],
    '🧠 PAIN’S INTELLIGENCE NETWORK': ['ai', 'autochat', 'autoreply', 'keyword', 'keywords', 'chatbot', 'gali', 'chatgpt', 'gemini', 'llama', 'deepseek', 'flux', 'pixart', 'dalle', 'bingai', 'blackbox', 'imagine', 'midjourney', 'simi', 'brainly', 'math'],
    '🎴 SHROUD DOWNLOAD SCROLLS': ['song', 'play', 'ytmp3', 'ytmp4', 'video', 'insta', 'igdl', 'tiktok', 'ttdl', 'facebook', 'fbdown', 'youtube', 'pinterest', 'pindl', 'twitter', 'twtdl', 'reddit', 'reddown', 'spotify', 'spdl', 'mediafire', 'mf', 'apk', 'gdrive', 'directdl', 'urldl', 'download', 'customdl', 'audiourl', 'videourl', 'imagedl', 'docdl', 'thumbnail', 'ytdl', 'gitclone', 'threads', 'snapchat', 'capcut', 'terabox'],
    '⚔️ SIX PATHS TOOLKIT': ['ping', 'dp', 'vv', 'translate', 'base64', 'qr', 'shorturl', 'calc', 'weather', 'github', 'ipinfo', 'tempmail', 'fakeinfo', 'binlookup', 'whois', 'dnslookup', 'portscan', 'screenshot', 'define', 'google', 'wiki', 'yts', 'playstore', 'npm', 'font', 'sticker', 'toimg', 'tomp3', 'tts', 'blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge', 'runtime', 'uptime', 'serverinfo', 'speedtest', 'device', 'pdf', 'ocr', 'remini', 'enhance', 'upscale', 'find', 'location', 'time', 'search'],
    '🎭 TOBI’S CHAOS ZONE': ['joke', 'meme', 'dare', 'truth', 'ascii', 'roast', 'compliment', 'ship', 'emojimix', 'character', 'quote', 'fact', 'trivia', 'coinflip', 'roll', 'riddle', 'wouldyourather', 'hack', 'report', 'spam', 'smsbomb', 'callbomb', 'crash', 'freeze', 'lag', 'bug', 'locspam', 'vcardspam', 'buttonspam', 'pollspam', 'contactspam', 'flirt', 'insult', 'pickup', 'tictactoe', '8ball', 'eightball', 'chess', 'hangman', 'fortune', 'compatibility', 'battle', 'prediction', 'shinobiquiz', 'roastme', 'praise', 'choose', 'dice', 'countdown'],
    '🕌 KNOWLEDGE SCROLLS': ['quran', 'hadith', 'prayer', 'qibla', 'asmaulhusna', 'surah', 'ayat', 'tafsir', 'dua', 'azkar'],
    '☁️ AKATSUKI ANIME REGISTRY': ['anime', 'manga', 'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'slap', 'kill', 'happy', 'wink', 'poke', 'dance', 'cringe'],
    '🏢 SHROUD LOGO FORGE': ['neon', 'glitch', 'gold', '3dtext', 'fire', 'water', 'galaxy', 'marvel', 'avengers', 'transformer', 'blackpink', 'gradient', 'luxury', 'royal', 'metal', 'steel', 'chrome', 'glossy'],
    '✏️ AKATSUKI TEXT MAKER': ['bali', 'cup', 'coffee', 'cloud', 'smoke', 'flower', 'leaf', 'wood', 'stone', 'blood', 'horror', 'scary', 'spooky', 'christmas', 'birthday', 'love', 'heart']
};

MENU_CATEGORIES['🛡️ AKATSUKI AUTOMATION'] = ['autoreact', 'autoreacts', 'autoread', 'autostatus', 'autochat', 'autoreply', 'keyword', 'keywords'];

const CATEGORY_MENU_CONFIG = {
    ownermenu: { title: 'BALI GIL MD OWNER MENU', subtitle: '👑 SHADOW LEADERSHIP // OWNER SCROLL', sectionTitle: '👑 OWNER COMMANDS', commands: MENU_CATEGORIES['👑 SHADOW LEADERSHIP'] },
    groupmenu: { title: 'AKATSUKI GROUP MENU', subtitle: '🩸 PAIN’S GROUP CONTROL // SHROUD ONLINE', sectionTitle: '⚔️ GROUP COMMANDS', commands: MENU_CATEGORIES['🩸 AKATSUKI GROUP CONTROL'] },
    kagemenu: { title: 'KAGE RIVALRY MENU', subtitle: '⚔️ VILLAGE RIVALRY // LIVE', sectionTitle: '⚔️ KAGE COMMANDS', commands: MENU_CATEGORIES['⚔️ KAGE VILLAGE RIVALRY'] },
    aimenu: { title: 'BALI GIL MD AI MENU', subtitle: '🧠 PAIN’S INTELLIGENCE NETWORK // ONLINE', sectionTitle: '🤖 AI COMMANDS', commands: MENU_CATEGORIES['🧠 PAIN’S INTELLIGENCE NETWORK'] },
    toolmenu: { title: 'SIX PATHS TOOL MENU', subtitle: '⚔️ AKATSUKI UTILITIES // READY', sectionTitle: '🧰 TOOL COMMANDS', commands: MENU_CATEGORIES['⚔️ SIX PATHS TOOLKIT'] },
    funmenu: { title: 'TOBI FUN MENU', subtitle: '🎭 CHAOS ZONE // HAVE FUN', sectionTitle: '🎲 FUN COMMANDS', commands: MENU_CATEGORIES['🎭 TOBI’S CHAOS ZONE'] },
    islamicmenu: { title: 'KNOWLEDGE MENU', subtitle: '🕌 KNOWLEDGE SCROLLS', sectionTitle: '📖 ISLAMIC COMMANDS', commands: MENU_CATEGORIES['🕌 KNOWLEDGE SCROLLS'] },
    animemenu: { title: 'AKATSUKI ANIME MENU', subtitle: '☁️ ANIME REGISTRY // ONLINE', sectionTitle: '🎴 ANIME COMMANDS', commands: MENU_CATEGORIES['☁️ AKATSUKI ANIME REGISTRY'] },
    logomenu: { title: 'SHROUD LOGO MENU', subtitle: '🏢 LOGO FORGE // READY', sectionTitle: '🎨 LOGO COMMANDS', commands: MENU_CATEGORIES['🏢 SHROUD LOGO FORGE'] },
    textmenu: { title: 'AKATSUKI TEXT MENU', subtitle: '✏️ TEXT MAKER // READY', sectionTitle: '🖋️ TEXT COMMANDS', commands: MENU_CATEGORIES['✏️ AKATSUKI TEXT MAKER'] },
    automenu: { title: 'AKATSUKI AUTOMATION MENU', subtitle: '🛡️ AUTOMATION SCROLLS // ONLINE', sectionTitle: '🔁 AUTOMATION COMMANDS', commands: MENU_CATEGORIES['🛡️ AKATSUKI AUTOMATION'] },
    securitymenu: { title: 'AKATSUKI SECURITY MENU', subtitle: '🛡️ SHIELD PROTOCOLS // ONLINE', sectionTitle: '🔒 SECURITY COMMANDS', commands: ['antilink', 'antidelete', 'antiviewonce', 'antifake', 'antispam', 'antibug', 'anticall', 'antistatus', 'moderationconfig', 'antispamwarn', 'antilinkwarn', 'safetymode', 'antiban'] },
    systemmenu: { title: 'BALI GIL MD SYSTEM MENU', subtitle: '⚙️ STATUS & SYSTEM SCROLLS', sectionTitle: '📡 SYSTEM COMMANDS', commands: ['ping', 'runtime', 'uptime', 'serverinfo', 'speedtest', 'device', 'health', 'botinfo', 'ownerhelp', 'report', 'status', 'rank', 'profile', 'leaderboard', 'level', 'levelconfig', 'restart', 'shutdown', 'xrestart', 'xshutdown'] },
    bugmenu: { title: 'AKATSUKI BUG MENU', subtitle: '🐛 CHAOS COMMANDS // USE RESPONSIBLY', sectionTitle: '🛡️ BUG COMMANDS', commands: ['bug', 'crash', 'freeze', 'lag'] },
    pluginmenu: { title: 'AKATSUKI PLUGIN MENU', subtitle: '🩸 CUSTOM PLUGIN SCROLLS', sectionTitle: '🧩 INSTALLED PLUGINS', commands: [], dynamic: 'plugins' },
    othermenu: { title: 'BALI GIL MD OTHER COMMANDS', subtitle: '📦 ADDITIONAL REGISTERED COMMANDS', sectionTitle: '📜 OTHER COMMANDS', commands: [], dynamic: 'other' }
};

const MENU_SHORTCUTS = [
    ['ownermenu', '👑 Owner'], ['groupmenu', '🩸 Group'], ['downloadmenu', '🎴 Download'],
    ['aimenu', '🧠 AI'], ['toolmenu', '⚔️ Tools'], ['funmenu', '🎭 Fun'],
    ['islamicmenu', '🕌 Islamic'], ['animemenu', '☁️ Anime'], ['logomenu', '🏢 Logo'],
    ['textmenu', '✏️ Text'], ['automenu', '🔁 Automation'], ['securitymenu', '🛡️ Security'],
    ['systemmenu', '⚙️ System'], ['kagemenu', '⚔️ Kage'], ['bugmenu', '🐛 Bug'], ['pluginmenu', '🧩 Plugins'], ['othermenu', '📦 Other']
];

module.exports = { MENU_CATEGORIES, CATEGORY_MENU_CONFIG, MENU_SHORTCUTS };
