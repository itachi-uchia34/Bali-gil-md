const fs = require('fs');
const path = require('path');

const BOY_IMAGES = [
    'dpz_boy_01_warrior.jpg', 'dpz_boy_02_samurai.jpg', 'dpz_boy_03_urban.jpg', 'dpz_boy_04_winter.jpg', 'dpz_boy_05_flame.jpg',
    'dpz_boy_06_cyber.jpg', 'dpz_boy_07_mask.jpg', 'dpz_boy_08_suit.jpg', 'dpz_boy_09_wolf.jpg', 'dpz_boy_10_thunder.jpg'
];
const GIRL_IMAGES = [
    'dpz_girl_01_kunoichi.jpg', 'dpz_girl_02_lantern.jpg', 'dpz_girl_03_rose.jpg', 'dpz_girl_04_moon.jpg', 'dpz_girl_05_flame.jpg',
    'dpz_girl_06_kunoichi_mirror.jpg', 'dpz_girl_07_lantern_mirror.jpg', 'dpz_girl_08_rose_mirror.jpg', 'dpz_girl_09_moon_mirror.jpg', 'dpz_girl_10_flame_mirror.jpg'
];
const BOY_LINES = [
    'A calm face, a war-born heart, and a resolve that refuses to kneel.',
    'The strongest shinobi do not chase attention; their presence commands the battlefield.',
    'Silence is not weakness. It is the shadow before power awakens.',
    'A true warrior carries his scars like proof that reality could not break him.'
];
const GIRL_LINES = [
    'Grace in her presence, fire in her spirit, and a heart stronger than any battlefield.',
    'She does not need permission to shine; even the darkness recognizes her power.',
    'A fearless kunoichi turns every wound into another reason to rise.',
    'Her calm is composed, her vision is clear, and her resolve belongs to no one else.'
];
const rotation = new Map();

function defaults() {
    return { enabled: true, mode: 'random', customBoys: [], customGirls: [] };
}
function getConfig(botData, chatId) {
    if (!botData.dpzSettings) botData.dpzSettings = {};
    if (!botData.dpzSettings[chatId]) botData.dpzSettings[chatId] = defaults();
    const config = botData.dpzSettings[chatId];
    config.enabled = config.enabled !== false;
    config.mode = ['boys', 'girls', 'random'].includes(config.mode) ? config.mode : 'random';
    config.customBoys = Array.isArray(config.customBoys) ? config.customBoys.slice(0, 10) : [];
    config.customGirls = Array.isArray(config.customGirls) ? config.customGirls.slice(0, 10) : [];
    return config;
}
function normalizeMode(value, configured) {
    const mode = String(value || '').trim().toLowerCase();
    if (['boy', 'boys', 'male', 'men', 'males'].includes(mode)) return 'boys';
    if (['girl', 'girls', 'female', 'women', 'females'].includes(mode)) return 'girls';
    if (configured === 'boys' || configured === 'girls') return configured;
    return Math.random() < 0.5 ? 'boys' : 'girls';
}
function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
}
function nextItem(chatId, mode, config) {
    const custom = mode === 'boys' ? config.customBoys : config.customGirls;
    const local = mode === 'boys' ? BOY_IMAGES : GIRL_IMAGES;
    const items = [...custom.map((url, index) => ({ source: 'custom', value: url, number: index + 1 })), ...local.map((file, index) => ({ source: 'local', value: file, number: custom.length + index + 1 }))];
    const key = `${chatId}:${mode}`;
    const index = rotation.get(key) || 0;
    rotation.set(key, (index + 1) % items.length);
    return items[index % items.length];
}
function localPath(filename) {
    return path.join(__dirname, '..', 'assets', filename);
}
function caption(mode, item, config) {
    const title = mode === 'boys' ? 'BOYS DPZ' : 'GIRLS DPZ';
    const symbol = mode === 'boys' ? '⚔️' : '🌙';
    const line = mode === 'boys' ? pick(BOY_LINES) : pick(GIRL_LINES);
    const customCount = mode === 'boys' ? config.customBoys.length : config.customGirls.length;
    return `╔══〔 ${symbol} 𝗠𝗔𝗗𝗔𝗥𝗔 ${title} 〕══╗\n\n${line}\n\n🖼️ *STYLE:* ${item.number}\n📚 *COLLECTION:* ${customCount + 10} visuals\n🔁 *ROTATION:* Next request selects another style.\n\nUse ".dpz boys" or ".dpz girls" to choose a collection.\n\n╚════════════════════╝`;
}
function settingsText(config) {
    return `╔══〔 👁️ 𝗗𝗣𝗭 SETTINGS 〕══╗\n\n⚙️ *Status:* ${config.enabled ? 'ON' : 'OFF'}\n🎯 *Mode:* ${config.mode}\n⚔️ *Boys visuals:* ${config.customBoys.length + 10}\n🌙 *Girls visuals:* ${config.customGirls.length + 10}\n🔗 *Trusted custom URLs:* ${config.customBoys.length + config.customGirls.length}\n\nAdmin commands:\n.dpzconfig on\n.dpzconfig off\n.dpzconfig mode boys|girls|random\n.dpzconfig add boys|girls <direct-image-url>\n.dpzconfig clear boys|girls|all\n.dpzconfig reset\n.dpzconfig show\n\n╚════════════════════╝`;
}
async function dpzCommand(sock, from, msg, q = '', botData = {}, saveBotData = () => {}) {
    const config = getConfig(botData, from);
    if (!config.enabled) return sock.sendMessage(from, { text: '⚠️ DPZ visuals are disabled in this chat. An admin can use `.dpzconfig on`.' }, { quoted: msg });
    const mode = normalizeMode(q, config.mode);
    const item = nextItem(from, mode, config);
    try {
        const image = item.source === 'local' ? fs.readFileSync(localPath(item.value)) : { url: item.value };
        return await sock.sendMessage(from, { image, caption: caption(mode, item, config) }, { quoted: msg });
    } catch (error) {
        console.error(`DPZ ${mode} image delivery failed:`, error.message);
        const fallback = mode === 'boys' ? pick(BOY_LINES) : pick(GIRL_LINES);
        return sock.sendMessage(from, { text: `⚠️ The selected DPZ image could not be sent.\n\n${fallback}\n\nTry again for the next visual.` }, { quoted: msg });
    }
}
async function dpzConfigCommand(sock, from, msg, isAdmin, q = '', botData = {}, saveBotData = () => {}) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ DPZ settings are available in groups only.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only group admins can change DPZ settings.' }, { quoted: msg });
    const config = getConfig(botData, from);
    const args = String(q).trim().split(/\s+/).filter(Boolean);
    const action = (args.shift() || 'show').toLowerCase();
    if (action === 'on' || action === 'off') config.enabled = action === 'on';
    else if (action === 'mode' && ['boys', 'girls', 'random'].includes(args[0])) config.mode = args[0];
    else if (action === 'reset') { rotation.delete(`${from}:boys`); rotation.delete(`${from}:girls`); }
    else if (action === 'clear') {
        if (args[0] === 'boys') config.customBoys = [];
        else if (args[0] === 'girls') config.customGirls = [];
        else if (args[0] === 'all') { config.customBoys = []; config.customGirls = []; }
    } else if (action === 'add') {
        const target = args.shift();
        const url = args.join(' ');
        if (!['boys', 'girls'].includes(target) || !/^https?:\/\/\S+$/i.test(url)) return sock.sendMessage(from, { text: '⚠️ Usage: `.dpzconfig add boys|girls <direct-image-url>`' }, { quoted: msg });
        const list = target === 'boys' ? config.customBoys : config.customGirls;
        if (list.length >= 10) return sock.sendMessage(from, { text: `⚠️ The ${target} custom collection already has 10 URLs. Clear it before adding more.` }, { quoted: msg });
        if (!list.includes(url)) list.push(url);
    } else if (action !== 'show' && !(action === 'mode' && config.mode === args[0])) {
        return sock.sendMessage(from, { text: settingsText(config) }, { quoted: msg });
    }
    saveBotData();
    return sock.sendMessage(from, { text: settingsText(config) }, { quoted: msg });
}
async function dpBoysCommand(sock, from, msg, q, botData, saveBotData) { return dpzCommand(sock, from, msg, 'boys', botData, saveBotData); }
async function dpGirlsCommand(sock, from, msg, q, botData, saveBotData) { return dpzCommand(sock, from, msg, 'girls', botData, saveBotData); }
module.exports = { dpzCommand, dpBoysCommand, dpGirlsCommand, dpzConfigCommand, BOY_IMAGES, GIRL_IMAGES };
