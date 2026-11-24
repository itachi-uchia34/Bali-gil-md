const TITLES = [
    { level: 1, title: 'Academy Observer' },
    { level: 2, title: 'Shadow Disciple' },
    { level: 3, title: 'Sharingan Initiate' },
    { level: 4, title: 'Uchiha Strategist' },
    { level: 5, title: 'Eternal Mangekyo' },
    { level: 6, title: 'Susanoo Commander' },
    { level: 7, title: 'Ten-Tails Vessel' },
    { level: 8, title: 'Rinnegan Sovereign' },
    { level: 9, title: 'Ghost of the Uchiha' },
    { level: 10, title: 'Madara’s Successor' },
    { level: 15, title: 'Infinite Tsukuyomi Lord' },
    { level: 20, title: 'Legendary War God' }
];
const activityCooldowns = new Map();

function getConfig(botData, groupId) {
    if (!botData.levelSettings) botData.levelSettings = {};
    if (!botData.levelSettings[groupId]) botData.levelSettings[groupId] = { enabled: true, announceLevelUp: true };
    const config = botData.levelSettings[groupId];
    config.enabled = config.enabled !== false;
    config.announceLevelUp = config.announceLevelUp !== false;
    return config;
}

function getProfiles(botData, groupId) {
    if (!botData.levelProfiles) botData.levelProfiles = {};
    if (!botData.levelProfiles[groupId]) botData.levelProfiles[groupId] = {};
    return botData.levelProfiles[groupId];
}

function calculateLevel(xp) {
    return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

function requiredXp(level) {
    return Math.pow(Math.max(1, level), 2) * 100;
}

function getTitle(level) {
    let selected = TITLES[0].title;
    for (const item of TITLES) {
        if (level >= item.level) selected = item.title;
    }
    return selected;
}

function ensureProfile(botData, groupId, userId, displayName = 'Shinobi') {
    const profiles = getProfiles(botData, groupId);
    if (!profiles[userId]) profiles[userId] = { xp: 0, messages: 0, name: displayName, lastActive: 0 };
    profiles[userId].name = displayName || profiles[userId].name || 'Shinobi';
    profiles[userId].xp = Number(profiles[userId].xp) || 0;
    profiles[userId].messages = Number(profiles[userId].messages) || 0;
    return profiles[userId];
}

function targetFromMessage(msg, q, fallback) {
    const context = msg.message?.extendedTextMessage?.contextInfo;
    return context?.mentionedJid?.[0] || context?.participant || (q || '').replace(/[^0-9]/g, '') && `${(q || '').replace(/[^0-9]/g, '')}@s.whatsapp.net` || fallback;
}

async function handleActivity(sock, from, msg, sender, isGroup, isMe, text, botData, saveBotData) {
    if (!isGroup || isMe || !sender || !text || text.startsWith('.')) return false;
    const config = getConfig(botData, from);
    if (!config.enabled) return false;
    const now = Date.now();
    const cooldownKey = `${from}:${sender}`;
    if (now - (activityCooldowns.get(cooldownKey) || 0) < 60000) return false;
    activityCooldowns.set(cooldownKey, now);
    const name = msg.pushName || `@${sender.split('@')[0]}`;
    const profile = ensureProfile(botData, from, sender, name);
    const oldLevel = calculateLevel(profile.xp);
    profile.xp += 5 + Math.floor(Math.random() * 6);
    profile.messages += 1;
    profile.lastActive = now;
    const newLevel = calculateLevel(profile.xp);
    saveBotData();
    if (config.announceLevelUp && newLevel > oldLevel) {
        await sock.sendMessage(from, { text: `🎉 @${sender.split('@')[0]} has reached *Level ${newLevel} — ${getTitle(newLevel)}*!\n\nMadara recognizes your growing power.`, mentions: [sender] });
    }
    return true;
}

async function rankCommand(sock, from, msg, q, botData, sender) {
    const target = targetFromMessage(msg, q, sender);
    if (!target) return sock.sendMessage(from, { text: '⚠️ Reply to a user, mention them, or use .rank.' }, { quoted: msg });
    const profile = ensureProfile(botData, from, target, `@${target.split('@')[0]}`);
    const level = calculateLevel(profile.xp);
    const currentLevelXp = requiredXp(level - 1);
    const nextLevelXp = requiredXp(level);
    const progress = Math.max(0, profile.xp - currentLevelXp);
    const needed = Math.max(1, nextLevelXp - currentLevelXp);
    const filled = Math.min(10, Math.floor((progress / needed) * 10));
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    const text = `╔══〔 𝗠𝗔𝗗𝗔𝗥𝗔 𝗥𝗔𝗡𝗞 〕══╗\n\n👤 *Shinobi:* @${target.split('@')[0]}\n⚔️ *Title:* ${getTitle(level)}\n🏆 *Level:* ${level}\n✨ *XP:* ${profile.xp}\n📨 *Messages:* ${profile.messages}\n📊 *Progress:* ${bar}\n\n╚════════════════════╝`;
    return sock.sendMessage(from, { text, mentions: [target] }, { quoted: msg });
}

async function leaderboardCommand(sock, from, msg, botData) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ Leaderboards are available in groups.' }, { quoted: msg });
    const profiles = getProfiles(botData, from);
    const entries = Object.entries(profiles).sort(([, a], [, b]) => (b.xp || 0) - (a.xp || 0)).slice(0, 10);
    if (!entries.length) return sock.sendMessage(from, { text: '📜 No shinobi activity has been recorded yet.' }, { quoted: msg });
    const mentions = entries.map(([id]) => id);
    const rows = entries.map(([id, profile], index) => `${index + 1}. @${id.split('@')[0]} — Lv.${calculateLevel(profile.xp)} ${getTitle(calculateLevel(profile.xp))} (${profile.xp} XP)`);
    return sock.sendMessage(from, { text: `╔══〔 𝗠𝗔𝗗𝗔𝗥𝗔 𝗟𝗘𝗔𝗗𝗘𝗥𝗕𝗢𝗔𝗥𝗗 〕══╗\n\n${rows.join('\n')}\n\n╚════════════════════╝`, mentions }, { quoted: msg });
}

async function levelCommand(sock, from, msg, isAdmin, q, botData, saveBotData) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ Level settings are available in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only group admins can change level settings.' }, { quoted: msg });
    const config = getConfig(botData, from);
    const action = (q || '').trim().toLowerCase();
    if (action === 'on' || action === 'off') {
        config.enabled = action === 'on';
        saveBotData();
        return sock.sendMessage(from, { text: `✅ Level tracking ${config.enabled ? 'enabled' : 'disabled'}.` }, { quoted: msg });
    }
    return sock.sendMessage(from, { text: '*Level Settings*\n\n.level on\n.level off\n.levelconfig\n.rank\n.leaderboard' }, { quoted: msg });
}

async function levelConfigCommand(sock, from, msg, isAdmin, botData) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ Level settings are available in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only group admins can view level settings.' }, { quoted: msg });
    const config = getConfig(botData, from);
    return sock.sendMessage(from, { text: `*Madara Level Configuration*\n\nTracking: ${config.enabled ? '✅ ON' : '❌ OFF'}\nLevel-up announcements: ${config.announceLevelUp ? '✅ ON' : '❌ OFF'}\n\nXP is awarded for normal group messages with a per-user activity cooldown.` }, { quoted: msg });
}

module.exports = { TITLES, getConfig, getProfiles, calculateLevel, getTitle, handleActivity, rankCommand, leaderboardCommand, levelCommand, levelConfigCommand };
