const settings = require('../settings');

async function allMenu(sock, from, msg, session, commands, pluginCommandNames = []) {
    // ===== HEAVY BOX HEADER =====
    let allMenuText = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    allMenuText += `┃  💀  *BALI GIL COMPLETE ALL MENU*  💀               ┃\n`;
    allMenuText += `┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
    allMenuText += `┃  📋 TOTAL COMMANDS: 300+                   ┃\n`;
    allMenuText += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

    // ===== CATEGORIES (آپ کی اوریجنل کیٹیگریز) =====
    const categories = {
        '👑 OWNER': ['public', 'private', 'mode', 'owner', 'setname', 'block', 'unblock', 'bcgc', 'bcall', 'restart', 'shutdown', 'xrestart', 'xshutdown', 'nuke', 'clear', 'backup', 'restore', 'clone', 'addsudo', 'delsudo', 'listsudo', 'setprefix', 'broadcast', 'self', 'autostatus', 'autoseen', 'autolike', 'autobio'],
        '👥 GROUP': ['kick', 'ban', 'tobiban', 'add', 'promote', 'madarapromote', 'demote', 'mute', 'gcoff', 'unmute', 'gcon', 'tagall', 'hidetag', 'grouplink', 'groupinfo', 'join', 'leave', 'setdesc', 'setppgc', 'getbio', 'getdp', 'accept', 'poll', 'everyonemsg', 'listonline', 'tagme', 'mention', 'kickoffline', 'snipe', 'editmsg', 'react', 'send', 'forward', 'save', 'welcome', 'goodbye', 'setwelcome', 'setgoodbye', 'antilink', 'antidelete', 'antiviewonce', 'antifake', 'antispam', 'antibug', 'anticall', 'antistatus'],
        '🤖 AI': ['ai', 'chatbot', 'gali', 'chatgpt', 'gemini', 'llama', 'deepseek', 'flux', 'pixart', 'dalle', 'bingai', 'blackbox', 'imagine', 'midjourney', 'simi', 'brainly', 'math'],
        '⬇️ DOWNLOAD': ['song', 'video', 'insta', 'tiktok', 'facebook', 'youtube', 'pinterest', 'twitter', 'reddit', 'spotify', 'mf', 'apk', 'gdrive', 'ytdl', 'ytmp3', 'ytmp4', 'gitclone', 'threads', 'snapchat', 'capcut', 'terabox'],
        '🛠️ TOOLS': ['ping', 'dp', 'vv', 'translate', 'base64', 'qr', 'shorturl', 'calc', 'weather', 'github', 'ipinfo', 'tempmail', 'fakeinfo', 'binlookup', 'whois', 'dnslookup', 'portscan', 'screenshot', 'define', 'google', 'wiki', 'yts', 'playstore', 'npm', 'sticker', 'toimg', 'tomp3', 'tts', 'blur', 'invert', 'crop', 'flip', 'grayscale', 'removebg', 'enlarge', 'runtime', 'uptime', 'serverinfo', 'speedtest', 'device', 'pdf', 'ocr', 'remini', 'enhance', 'upscale', 'find', 'location', 'time', 'search'],
        '🎉 FUN': ['joke', 'meme', 'dare', 'truth', 'ascii', 'roast', 'compliment', 'ship', 'emojimix', 'character', 'quote', 'fact', 'trivia', 'coinflip', 'roll', 'riddle', 'wouldyourather', 'hack', 'report', 'spam', 'smsbomb', 'callbomb', 'crash', 'freeze', 'lag', 'bug', 'locspam', 'vcardspam', 'buttonspam', 'pollspam', 'contactspam', 'flirt', 'insult', 'pickup', 'dare', 'truth', 'tictactoe', '8ball', 'chess', 'hangman'],
        '🕌 ISLAMIC': ['quran', 'hadith', 'prayer', 'qibla', 'asmaulhusna', 'surah', 'ayat', 'tafsir', 'dua', 'azkar'],
        '🎌 ANIME': ['anime', 'manga', 'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'slap', 'kill', 'happy', 'wink', 'poke', 'dance', 'cringe'],
        '🏢 LOGO': ['neon', 'glitch', 'gold', '3dtext', 'fire', 'water', 'galaxy', 'marvel', 'avengers', 'transformer', 'blackpink', 'gradient', 'luxury', 'royal', 'metal', 'steel', 'chrome', 'glossy'],
        '✏️ TEXT MAKER': ['bali', 'cup', 'coffee', 'cloud', 'smoke', 'flower', 'leaf', 'wood', 'stone', 'blood', 'horror', 'scary', 'spooky', 'christmas', 'birthday', 'love', 'heart']
    };

    if (pluginCommandNames.length > 0) {
        categories['🩸 AKATSUKI PLUGINS'] = pluginCommandNames;
    }

    // ===== BUILD LIST (Compact per category) =====
    for (const [category, cmds] of Object.entries(categories)) {
        // Category Header with Heavy Box
        allMenuText += `┏━━━━━━ ❲ *${category}* ❳ ━━━━━━┓\n`;
        
        let line = `┃  ➤ `;
        cmds.forEach((cmd, index) => {
            line += `.${cmd}`;
            if (index < cmds.length - 1) line += `, `;
            
            // اگر لائن بہت لمبی ہو جائے تو توڑ دو (WhatsApp کیپشن سیف رکھنے کے لیے)
            if (line.length > 90) {
                allMenuText += `${line}\n`;
                line = `┃  ➤ `;
            }
        });
        // باقی بچی ہوئی لائن
        if (line !== `┃  ➤ `) allMenuText += `${line}\n`;
        
        allMenuText += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    }

    // ===== FOOTER =====
    allMenuText += `☠️  *POWERED BY : BALI GIL*  ☠️`;

    // ===== SEND =====
    try {
        await sock.sendMessage(from, { image: { url: settings.startimage }, caption: allMenuText }, { quoted: msg });
    } catch (e) {
        // Fallback
        await sock.sendMessage(from, { text: allMenuText }, { quoted: msg });
    }
}

module.exports = allMenu;