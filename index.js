require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage, jidNormalizedUser, Browsers, delay } = require('@whiskeysockets/baileys');
const P = require('pino');
const { OpenAI } = require('openai');
const os = require('os');
const { buildFullMenuText } = require('./lib/menu');

// Import all commands
const commands = {
    ...require('./commands/productivity'),
    ...require('./commands/texttools'),
    ...require('./commands/extra'),
    // Media & Download
    song: require('./commands/song'),
    video: require('./commands/video'),
    insta: require('./commands/insta'),
    tiktok: require('./commands/tiktok'),
    facebook: require('./commands/facebook'),
    youtube: require('./commands/youtube'),
    pinterest: require('./commands/pinterest'),
    twitter: require('./commands/twitter'),
    reddit: require('./commands/reddit'),
    spotify: require('./commands/spotify'),
    mediafire: require('./commands/mf'),
    apk: require('./commands/apk'),
    gdrive: require('./commands/gdrive'),
    mf: require('./commands/mf'),
   
    // Group Management
    kick: require('./commands/kick'),
    add: require('./commands/add'),
    promote: require('./commands/promote'),
    demote: require('./commands/demote'),
    revoke: require('./commands/revoke'),
    invite: require('./commands/invite'),
    mute: require('./commands/mute'),
    unmute: require('./commands/unmute'),
    kickoffline: require('./commands/kickoffline'),
    hidetag: require('./commands/hidetag'),
    tagall: require('./commands/tagall'),
    tagadmin: require('./commands/tagadmin'),
    groupinfo: require('./commands/groupinfo'),
    grouplink: require('./commands/grouplink'),
    join: require('./commands/join'),
    leave: require('./commands/leave'),
    setdesc: require('./commands/setdesc'),
    setppgc: require('./commands/setppgc'),
    getbio: require('./commands/getbio'),
    getdp: require('./commands/getdp'),
    accept: require('./commands/accept'),

    // Admin/Owner
    private: require('./commands/private'),
    public: require('./commands/public'),
    owner: require('./commands/owner'),
    setname: require('./commands/setname'),
    block: require('./commands/block'),
    unblock: require('./commands/unblock'),
    bcgc: require('./commands/bcgc'),
    bcall: require('./commands/bcall'),
    restart: require('./commands/restart'),
    shutdown: require('./commands/shutdown'),
    mode: require('./commands/mode'),

    // Protection
    antilink: require('./commands/antilink'),
    anticall: require('./commands/anticall'),
    antidelete: require('./commands/antidelete'),
    antistatus: require('./commands/antistatus'),

    // Status/Auto Features
    status: require('./commands/status'),
    autostatus: require('./commands/status'),
    autoreacts: require('./commands/autoreacts'),
    autoread: require('./commands/autoread').autoreadCommand,

    // AI
    ai: require('./commands/ai'),
    animedp: require('./commands/animedp').animedp,

    // Fun
    joke: require('./commands/joke'),
    meme: require('./commands/meme'),
    dare: require('./commands/dare'),
    truth: require('./commands/truth'),
    ascii: require('./commands/ascii'),
    roast: require('./commands/roast'),
    compliment: require('./commands/compliment'),
    ship: require('./commands/ship'),
    emojimix: require('./commands/emojimix'),
    character: require('./commands/character'),
    quote: require('./commands/quote'),
    urdupoetry: require('./commands/urdupoetry').urdupoetry,
    dpboys: require('./commands/dpboys').dpboys,
    dpgirls: require('./commands/dpgirls').dpgirls,
    fact: require('./commands/fact'),
    trivia: require('./commands/trivia'),
    coinflip: require('./commands/coinflip'),
    roll: require('./commands/roll'),
    riddle: require('./commands/riddle'),
    wouldyourather: require('./commands/wouldyourather'),

    // Tools
    ping: require('./commands/ping'),
    dp: require('./commands/dp'),
    vv: require('./commands/vv'),
    translate: require('./commands/translate'),
    base64: require('./commands/base64'),
    qr: require('./commands/qr'),
    shorturl: require('./commands/shorturl'),
    calc: require('./commands/calc'),
    weather: require('./commands/weather'),
    github: require('./commands/github'),
    ipinfo: require('./commands/ipinfo'),
    tempmail: require('./commands/tempmail'),
    fakeinfo: require('./commands/fakeinfo'),
    binlookup: require('./commands/binlookup'),
    whois: require('./commands/whois'),
    dnslookup: require('./commands/dnslookup'),
    portscan: require('./commands/portscan'),
    screenshot: require('./commands/screenshot'),
    define: require('./commands/define'),
    google: require('./commands/google'),
    wiki: require('./commands/wiki'),
    yts: require('./commands/yts'),
    playstore: require('./commands/playstore'),
    npm: require('./commands/npm'),
    sticker: require('./commands/sticker'),
    toimg: require('./commands/toimg'),
    tomp3: require('./commands/tomp3'),
    tts: require('./commands/tts'),
    blur: require('./commands/blur'),
    invert: require('./commands/invert'),
    crop: require('./commands/crop'),
    flip: require('./commands/flip'),
    grayscale: require('./commands/grayscale'),
    removebg: require('./commands/removebg'),
    enlarge: require('./commands/enlarge'),

    // Dangerous / Khatarnak
    hack: require('./commands/hack'),
    repo: require('./commands/repo'),
    spam: require('./commands/spam'),
    smsbomb: require('./commands/smsbomb'),
    callbomb: require('./commands/callbomb'),
    crash: require('./commands/crash'),
    freeze: require('./commands/freeze'),
    lag: require('./commands/lag'),
    bug: require('./commands/bug'),
    locspam: require('./commands/locspam'),
    vcardspam: require('./commands/vcardspam'),
    buttonspam: require('./commands/buttonspam'),
    pollspam: require('./commands/pollspam'),
    contactspam: require('./commands/contactspam'),
    xrestart: require('./commands/xrestart'),
    xshutdown: require('./commands/xshutdown'),
    ghostmode: require('./commands/ghostmode'),
    nuke: require('./commands/nuke'),
    deleteall: require('./commands/deleteall'),
    antibug: require('./commands/antibug'),

    // Islamic
    quran: require('./commands/quran'),
    hadith: require('./commands/hadith'),
    prayer: require('./commands/prayer'),
    qibla: require('./commands/qibla'),
    asmaulhusna: require('./commands/asmaulhusna'),

    // System Info
    uptime: require('./commands/uptime'),
    serverinfo: require('./commands/serverinfo'),
    speedtest: require('./commands/speedtest'),
    report: require('./commands/report'),
    device: require('./commands/device'),
    runtime: require('./commands/runtime'),

    // Other
    poll: require('./commands/poll'),
    remind: require('./commands/remind'),
    timer: require('./commands/timer'),
    password: require('./commands/password'),
    morse: require('./commands/morse'),
    binary: require('./commands/binary'),
    hex: require('./commands/hex'),
    pastebin: require('./commands/pastebin'),
    news: require('./commands/news'),
    crypto: require('./commands/crypto'),
    movie: require('./commands/movie'),
    anime: require('./commands/anime'),
    manga: require('./commands/manga'),
    lyrics: require('./commands/lyrics'),
    chatbot: require('./commands/chatbot'),
    snipe: require('./commands/snipe'),
    editmsg: require('./commands/editmsg'),
    react: require('./commands/react'),
    send: require('./commands/send'),
    forward: require('./commands/forward'),
    clear: require('./commands/clear'),
    save: require('./commands/save'),
    backup: require('./commands/backup'),
    restore: require('./commands/restore'),
    clone: require('./commands/clone'),
    mention: require('./commands/mention'),
    tagme: require('./commands/tagme'),
    everyonemsg: require('./commands/everyonemsg'),
    listonline: require('./commands/listonline'),
    mycmd: require('./commands/mycmd'),
    gali: require('./commands/gali'),
    utils: require('./commands/utils'),
    font: require('./commands/font'),
    pair: require('./commands/pair'),
    bug_powerful: require('./commands/bug_powerful'),
    groupbug: require('./commands/group_bug'),
    massbug: require('./commands/mass_bug'),
    vcardbug: require('./commands/vcard_bug'),
    ioscrash: require('./commands/ios_crash'),
    androcrash: require('./commands/andro_crash'),
    numberbug: require('./commands/number_bug'),

    // Previously missing commands - now registered
    goodbye: require('./commands/goodbye'),
    welcome: require('./commands/welcome'),
    gc: require('./commands/gc'),
    allmenu: require('./commands/allmenu'),
    group: require('./commands/group'),
    inbox: require('./commands/inbox'),
    boysdpz: require('./commands/boysdpz'),
    girlsdpz: require('./commands/girlsdpz'),
    bug_personal: require('./commands/bug_personal'),
    bug_group: require('./commands/bug_group'),
};

const { handleAutoread } = require('./commands/autoread');
const { handleStatusUpdate } = require('./commands/autostatus');
const { storeMessage, handleMessageRevocation } = require('./commands/antidelete');
const { handleSnipe } = require('./commands/snipe');

const app = express();
const server = http.createServer(app);

// Telegram Bot Setup
const tgToken = process.env.TELEGRAM_BOT_TOKEN;
if (!tgToken) {
    console.error('TELEGRAM_BOT_TOKEN not set in environment variables!');
}

const tgBot = tgToken ? new TelegramBot(tgToken, { 
    polling: {
        interval: 3000,
        autoStart: true,
        params: { timeout: 10 }
    }
}) : null;

let telegramBotLink = '';

function normalizeTelegramUsername(username) {
    return String(username || '').trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');
}

function publicDeploymentUrl() {
    if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        const domain = process.env.RAILWAY_PUBLIC_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return `https://${domain}`;
    }
    return '';
}

async function resolveTelegramBotLink() {
    if (!tgBot) {
        telegramBotLink = '';
        return '';
    }
    const configuredUsername = normalizeTelegramUsername(process.env.TELEGRAM_BOT_USERNAME);
    if (configuredUsername) {
        telegramBotLink = `https://t.me/${configuredUsername}`;
        return telegramBotLink;
    }
    try {
        const botInfo = await tgBot.getMe();
        const username = normalizeTelegramUsername(botInfo?.username);
        telegramBotLink = username ? `https://t.me/${username}` : '';
    } catch (error) {
        console.warn('[Telegram] Unable to resolve bot link:', error.message);
    }
    return telegramBotLink;
}

if (tgBot) {
    tgBot.on('polling_error', (error) => {
        console.log('Telegram polling error:', error.message);
        if (error.message && (error.message.includes('409') || error.message.includes('Conflict'))) {
            console.log('Another instance detected. Stopping this instance...');
            tgBot.stopPolling();
        }
        if (error.message && error.message.includes('401')) {
            console.log('Telegram Token is invalid (401 Unauthorized).');
            tgBot.stopPolling();
        }
    });
    void resolveTelegramBotLink();
}

// Import settings
const settings = require('./settings');

// Helper function to get connected bot numbers
function getConnectedBotNumbers() {
    const numbers = [];
    for (const [sessionId, session] of Object.entries(sessions)) {
        if (session.sock && session.sock.user) {
            const num = jidNormalizedUser(session.sock.user.id).split('@')[0];
            numbers.push(num);
        }
    }
    return numbers;
}

// Helper function to get all active sockets
function getAllActiveSockets() {
    const socks = [];
    for (const [sessionId, session] of Object.entries(sessions)) {
        if (session.sock && session.isConnected) {
            socks.push({ sock: session.sock, sessionId, phoneNumber: session.phoneNumber });
        }
    }
    return socks;
}

// Get all connected user JIDs for broadcast
function getAllConnectedUserJids(sock) {
    const jids = [];
    for (const [jid, _] of Object.entries(sock.chats || {})) {
        if (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us')) {
            jids.push(jid);
        }
    }
    return jids;
}

// Premium check function
function isPremiumUser(chatId) {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID || settings.tgOwnerId;
    if (chatId.toString() === ownerChatId) return true;
    if (settings.premiumUsers && settings.premiumUsers.includes(chatId.toString())) return true;
    return false;
}

// Owner check for Telegram
function isTgOwner(chatId) {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID || settings.tgOwnerId;
    return chatId.toString() === ownerChatId;
}

function normalizeWhatsAppNumber(rawNumber) {
    const digits = String(rawNumber || '').replace(/\D/g, '');
    return digits.startsWith('00') ? digits.slice(2) : digits;
}

function isValidWhatsAppNumber(cleanNumber) {
    return /^[1-9]\d{9,14}$/.test(cleanNumber);
}

function sessionIdForNumber(cleanNumber) {
    return `wa_${cleanNumber}`;
}

function getSessionForNumber(cleanNumber) {
    const canonicalId = sessionIdForNumber(cleanNumber);
    if (sessions[canonicalId]) {
        return { session: sessions[canonicalId], sessionId: canonicalId };
    }

    const existing = Object.entries(sessions).find(([sessionId, session]) => {
        return session.phoneNumber === cleanNumber || session.pairingNumber === cleanNumber || String(session.userId) === canonicalId;
    });
    if (existing) {
        return { session: existing[1], sessionId: existing[0] };
    }

    sessions[canonicalId] = new BotSession(canonicalId);
    return { session: sessions[canonicalId], sessionId: canonicalId };
}

function resetExpiredPairingAttempt(session) {
    if (!session || session.isConnected) return false;
    const expired = session.pairingExpiresAt && Date.now() >= session.pairingExpiresAt;
    if (!session.isInitializing || !expired) return false;

    session.isInitializing = false;
    session.pairingCode = null;
    session.pairingExpiresAt = null;
    session.sendConnectionStatus();
    return true;
}

async function sendPairingCodeToTelegram(chatId, code) {
    if (!tgBot || !chatId || !code) return;
    const rawCode = String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const codeMsg =
        `╭━━〔 *PAIRING CODE READY* 〕━━╮\n` +
        `┃ Code: \`${rawCode}\`\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `Open WhatsApp → Settings → Linked Devices → Link with phone number, then enter the 8 characters exactly as shown.\n` +
        `Do not type spaces or a hyphen. The code is temporary; keep this chat open until the device is linked.\n\n` +
        `> POWERED BY ITACHI-UCHIHA`;
    await tgBot.sendMessage(chatId, codeMsg, { parse_mode: 'Markdown' });
}

async function startTelegramPairing(chatId, rawNumber) {
    const cleanNumber = normalizeWhatsAppNumber(rawNumber);
    if (!isValidWhatsAppNumber(cleanNumber)) {
        await tgBot.sendMessage(chatId, 'Invalid number. Send the complete WhatsApp number with country code, without a leading local 0. Example: `923271054080`.', { parse_mode: 'Markdown' });
        return;
    }

    const { session, sessionId } = getSessionForNumber(cleanNumber);

    if (!botData.statusSettings[sessionId]) {
        botData.statusSettings[sessionId] = {
            autoStatus: false,
            autoSeen: false,
            autoLike: false,
            autoDownload: false,
            isPublic: true
        };
        saveBotData();
    }

    resetExpiredPairingAttempt(session);
    if (session.isInitializing) {
        session.tgChatId = chatId;
        const pairingActive = Boolean(session.pairingCode && session.pairingExpiresAt && Date.now() < session.pairingExpiresAt);
        if (pairingActive) {
            await sendPairingCodeToTelegram(chatId, session.pairingCode);
        } else {
            await tgBot.sendMessage(chatId, 'A connection request is already running. The pairing code will be sent here as soon as it is ready.', { parse_mode: 'Markdown' });
        }
        return;
    }

    if (session.isConnected) {
        await tgBot.sendMessage(chatId, `This WhatsApp number is already linked and online: \`${session.phoneNumber || cleanNumber}\`.`, { parse_mode: 'Markdown' });
        return;
    }

    const initMsg =
        `╭━━〔 *PAIRING REQUEST* 〕━━╮\n` +
        `┃ Number: \`${cleanNumber}\`\n` +
        `┃ Session: \`${sessionId}\`\n` +
        `┃ Status: generating code...\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `Keep this chat open. The code will arrive here shortly.`;

    await tgBot.sendMessage(chatId, initMsg, { parse_mode: 'Markdown' });
    session.tgChatId = chatId;
    await session.initialize(cleanNumber);
}

// =================== TELEGRAM BOT (ONLY PAIRING + PREMIUM + OWNER-ONLY STATUS) ===================
if (tgBot) {
    tgBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const isOwner = isTgOwner(chatId);
        
        const welcomeMessage = 
            `╭━━〔 *BALI GIL MINI BOT* 〕━━╮\n` +
            `┃  WhatsApp connection center\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
            `*Available actions*\n` +
            `• /connect <number> — request a pairing code\n` +
            `• /link <number> — alias for /connect\n` +
            `• /deploy — show website and bot links\n` +
            `• Send a number directly — quick connect\n` +
            `• /clearsession — remove your current session\n` +
            `${isOwner ? `• /status — view connected sessions\n` : ''}` +
            `${isOwner ? `• /follow <link> — follow a channel\n` : ''}` +
            `\n` +
            `*Connection steps*\n` +
            `1. Use your full WhatsApp number with country code.\n` +
            `2. Example: \`923271054080\`\n` +
            `3. Open WhatsApp → Linked Devices → Link a Device.\n` +
            `4. Enter the code sent here.\n\n` +
            `> The pairing code is temporary. Keep this chat open while connecting.\n` +
            `> POWERED BY ITACHI-UCHIHA`;

        try {
            await tgBot.sendPhoto(chatId, settings.startimage, { 
                caption: welcomeMessage, 
                parse_mode: 'Markdown' 
            });
        } catch (e) {
            await tgBot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        }
    });

    // Explicit connection command
    tgBot.onText(/\/(?:connect|link)(?:\s+(.+))?/, async (msg, match) => {
        const rawNumber = match && match[1] ? match[1] : '';
        if (!rawNumber.trim()) {
            await tgBot.sendMessage(msg.chat.id, 'Usage: /connect 923271054080\\nUse the complete number with country code and without the plus sign.', { parse_mode: 'Markdown' });
            return;
        }
        await startTelegramPairing(msg.chat.id, rawNumber);
    });

    // Deployment link command
    tgBot.onText(/\/deploy/, async (msg) => {
        const botLink = await resolveTelegramBotLink();
        const website = publicDeploymentUrl();
        const message =
            `*BALI GIL DEPLOYMENT CENTER*\n\n` +
            (website ? `Live website: ${website}\n` : 'Live website: not configured\n') +
            (botLink ? `Telegram bot: ${botLink}\n\n` : '\n') +
            `To connect a WhatsApp number, send /connect <number> or use the UI on the website if available.`;

        await tgBot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    });
}

// Basic web UI and server start (minimal to keep deployment running)
app.get('/', (req, res) => {
    res.send('BALI GIL-mini-bot is running');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
