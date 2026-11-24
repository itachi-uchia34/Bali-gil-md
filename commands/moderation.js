const DEFAULT_LINK_WARNING = '⚠️ {user}, links are not allowed in this group.';
const DEFAULT_SPAM_WARNING = '⚠️ {user}, please slow down. Spam is not allowed in this group.';
const spamTracker = new Map();

const ACTIONS = ['delete', 'warn', 'kick'];
const DOMAIN_PATTERN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|co|pk|xyz|me|dev|app|gg|ly|info|biz|site|online|store|tech|ai|cloud|pro|vip|uk|us|de|fr|in|ca|au|ru|jp|cn)\b/gi;
const URL_PATTERN = /(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>()]+/gi;
const SPECIAL_LINK_PATTERN = /(?:chat\.whatsapp\.com|wa\.me|t\.me|discord\.gg|bit\.ly|tinyurl\.com)\/[^\s<>()]+/gi;

function getConfig(botData, groupId) {
    if (!botData.moderationGroups) botData.moderationGroups = {};
    if (!botData.moderationGroups[groupId]) {
        botData.moderationGroups[groupId] = {
            antiLink: { enabled: false, action: 'delete', warning: DEFAULT_LINK_WARNING, allowedDomains: [] },
            antiSpam: { enabled: false, action: 'delete', warning: DEFAULT_SPAM_WARNING, limit: 5, windowMs: 10000 }
        };
    }
    const config = botData.moderationGroups[groupId];
    config.antiLink = { enabled: false, action: 'delete', warning: DEFAULT_LINK_WARNING, allowedDomains: [], ...(config.antiLink || {}) };
    config.antiSpam = { enabled: false, action: 'delete', warning: DEFAULT_SPAM_WARNING, limit: 5, windowMs: 10000, ...(config.antiSpam || {}) };
    if (!ACTIONS.includes(config.antiLink.action)) config.antiLink.action = 'delete';
    if (!ACTIONS.includes(config.antiSpam.action)) config.antiSpam.action = 'delete';
    if (!Array.isArray(config.antiLink.allowedDomains)) config.antiLink.allowedDomains = [];
    config.antiLink.allowedDomains = [...new Set(config.antiLink.allowedDomains.map(normalizeDomain).filter(Boolean))];
    config.antiSpam.limit = Math.max(2, Math.min(50, Number(config.antiSpam.limit) || 5));
    config.antiSpam.windowMs = Math.max(3000, Math.min(120000, Number(config.antiSpam.windowMs) || 10000));
    return config;
}

function normalizeText(text) {
    return String(text || '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\[\s*dot\s*\]/gi, '.')
        .replace(/\(\s*dot\s*\)/gi, '.')
        .replace(/\s+dot\s+/gi, '.')
        .replace(/\s*:\s*\/\s*\//g, '://');
}

function normalizeDomain(value) {
    let domain = String(value || '').trim().toLowerCase();
    domain = domain.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0].trim();
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain) ? domain : '';
}

function extractLinks(text) {
    const normalized = normalizeText(text);
    const raw = [
        ...(normalized.match(URL_PATTERN) || []),
        ...(normalized.match(SPECIAL_LINK_PATTERN) || []),
        ...(normalized.match(DOMAIN_PATTERN) || [])
    ];
    const links = [];
    for (const value of raw) {
        const clean = value.replace(/[),.!?;:]+$/g, '');
        const domain = normalizeDomain(clean);
        if (domain && !links.some(item => item.domain === domain && item.value === clean)) links.push({ value: clean, domain });
    }
    return links;
}

function containsLink(text) {
    return extractLinks(text).length > 0;
}

function getBlockedLinks(text, allowedDomains = []) {
    const allowed = new Set((allowedDomains || []).map(normalizeDomain).filter(Boolean));
    return extractLinks(text).filter(link => ![...allowed].some(domain => link.domain === domain || link.domain.endsWith(`.${domain}`)));
}

function renderWarning(template, user, details = {}) {
    return String(template || DEFAULT_LINK_WARNING)
        .replaceAll('{user}', `@${String(user || '').split('@')[0]}`)
        .replaceAll('{url}', details.url || '')
        .replaceAll('{domain}', details.domain || '')
        .replaceAll('{count}', String(details.count || ''));
}

function usage() {
    return [
        '*LINK & SPAM MODERATION*', '',
        '.antilink on | off | delete | warn | kick',
        '.antilink allow <domain>',
        '.antilink unallow <domain>',
        '.antilink domains',
        '.antilink clear',
        '.antilinkwarn <warning>', '',
        '.antispam on | off | delete | warn | kick',
        '.antispamwarn <warning>',
        '.moderationconfig', '',
        'Warning placeholders: {user}, {url}, {domain}',
        'Actions: delete, warn, kick. Admins and the owner are exempt.'
    ].join('\n');
}

async function configure(sock, from, msg, isAdmin, args, botData, saveBotData, type) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only group admins can change moderation settings.' }, { quoted: msg });
    const config = getConfig(botData, from);
    const moderation = config[type];
    const action = (args[0] || '').toLowerCase();
    if (!action) return sock.sendMessage(from, { text: usage() }, { quoted: msg });
    if (type === 'antiLink' && ['allow', 'unallow', 'domains', 'clear'].includes(action)) {
        if (action === 'domains') {
            const domains = moderation.allowedDomains.length ? moderation.allowedDomains.map(domain => `• ${domain}`).join('\n') : 'No allowed domains configured.';
            return sock.sendMessage(from, { text: `✅ *ALLOWED DOMAINS*\n\n${domains}` }, { quoted: msg });
        }
        if (action === 'clear') moderation.allowedDomains = [];
        else {
            const domain = normalizeDomain(args[1]);
            if (!domain) return sock.sendMessage(from, { text: 'Usage: .antilink allow <example.com> or .antilink unallow <example.com>' }, { quoted: msg });
            if (action === 'allow') moderation.allowedDomains = [...new Set([...moderation.allowedDomains, domain])];
            if (action === 'unallow') moderation.allowedDomains = moderation.allowedDomains.filter(item => item !== domain);
        }
        saveBotData();
        return sock.sendMessage(from, { text: `✅ Allowed-domain list updated.\n\n${moderation.allowedDomains.length ? moderation.allowedDomains.join(', ') : 'No allowed domains configured.'}` }, { quoted: msg });
    }
    if (action === 'on') moderation.enabled = true;
    else if (action === 'off') moderation.enabled = false;
    else if (ACTIONS.includes(action)) { moderation.enabled = true; moderation.action = action; }
    else return sock.sendMessage(from, { text: usage() }, { quoted: msg });
    saveBotData();
    return sock.sendMessage(from, { text: `✅ ${type === 'antiLink' ? 'Anti-link' : 'Anti-spam'} is ${moderation.enabled ? 'enabled' : 'disabled'} with action: ${moderation.action}.` }, { quoted: msg });
}

async function setWarning(sock, from, msg, isAdmin, args, botData, saveBotData, type) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only group admins can customize moderation warnings.' }, { quoted: msg });
    const warning = args.join(' ').trim();
    if (!warning) return sock.sendMessage(from, { text: `Usage: .${type === 'antiLink' ? 'antilinkwarn' : 'antispamwarn'} <warning>\nUse {user}, {url}, and {domain} as placeholders.` }, { quoted: msg });
    getConfig(botData, from)[type].warning = warning;
    saveBotData();
    return sock.sendMessage(from, { text: `✅ Custom ${type === 'antiLink' ? 'anti-link' : 'anti-spam'} warning saved.` }, { quoted: msg });
}

async function moderationConfig(sock, from, msg, isAdmin, botData) {
    if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Only group admins can view moderation settings.' }, { quoted: msg });
    const config = getConfig(botData, from);
    const text = [
        '*LINK & SPAM MODERATION CONFIGURATION*', '',
        `Anti-link: ${config.antiLink.enabled ? '✅ ON' : '❌ OFF'} (${config.antiLink.action})`,
        `Allowed domains: ${config.antiLink.allowedDomains.length ? config.antiLink.allowedDomains.join(', ') : 'none'}`,
        `Anti-spam: ${config.antiSpam.enabled ? '✅ ON' : '❌ OFF'} (${config.antiSpam.action})`,
        `Spam threshold: ${config.antiSpam.limit} messages / ${config.antiSpam.windowMs / 1000}s`, '',
        `Link warning: ${config.antiLink.warning}`,
        `Spam warning: ${config.antiSpam.warning}`
    ].join('\n');
    return sock.sendMessage(from, { text }, { quoted: msg });
}

async function applyAction(sock, from, msg, sender, moderation, warning, details = {}) {
    const rendered = renderWarning(warning, sender, details);
    try {
        if (moderation.action === 'delete' || moderation.action === 'kick') await sock.sendMessage(from, { delete: msg.key });
        if (moderation.action === 'kick') await sock.groupParticipantsUpdate(from, [sender], 'remove');
    } catch (error) {}
    try { await sock.sendMessage(from, { text: rendered, mentions: [sender] }, { quoted: msg }); } catch (error) {}
}

async function handleMessage(sock, from, msg, text, sender, isGroup, isAdmin, isOwner, botData) {
    if (!isGroup || isAdmin || isOwner || !text) return false;
    const config = getConfig(botData, from);
    const blockedLinks = config.antiLink.enabled ? getBlockedLinks(text, config.antiLink.allowedDomains) : [];
    if (blockedLinks.length) {
        await applyAction(sock, from, msg, sender, config.antiLink, config.antiLink.warning || DEFAULT_LINK_WARNING, { url: blockedLinks[0].value, domain: blockedLinks[0].domain, count: blockedLinks.length });
        return true;
    }
    if (config.antiSpam.enabled) {
        const now = Date.now();
        const key = `${from}:${sender}`;
        const record = spamTracker.get(key) || [];
        const recent = record.filter(timestamp => now - timestamp <= config.antiSpam.windowMs);
        recent.push(now);
        spamTracker.set(key, recent);
        if (recent.length >= config.antiSpam.limit) {
            spamTracker.set(key, []);
            await applyAction(sock, from, msg, sender, config.antiSpam, config.antiSpam.warning || DEFAULT_SPAM_WARNING, { count: recent.length });
            return true;
        }
    }
    return false;
}

module.exports = {
    DEFAULT_LINK_WARNING,
    DEFAULT_SPAM_WARNING,
    ACTIONS,
    getConfig,
    normalizeText,
    normalizeDomain,
    extractLinks,
    containsLink,
    getBlockedLinks,
    antiLinkCommand: (sock, from, msg, isAdmin, botData, saveBotData, args) => configure(sock, from, msg, isAdmin, args, botData, saveBotData, 'antiLink'),
    antiSpamCommand: (sock, from, msg, isAdmin, botData, saveBotData, args) => configure(sock, from, msg, isAdmin, args, botData, saveBotData, 'antiSpam'),
    antiLinkWarningCommand: (sock, from, msg, isAdmin, botData, saveBotData, args) => setWarning(sock, from, msg, isAdmin, args, botData, saveBotData, 'antiLink'),
    antiSpamWarningCommand: (sock, from, msg, isAdmin, botData, saveBotData, args) => setWarning(sock, from, msg, isAdmin, args, botData, saveBotData, 'antiSpam'),
    moderationConfig,
    handleMessage
};
