const MAX_RULES = 30;
const MAX_KEYWORD_LENGTH = 60;
const MAX_RESPONSE_LENGTH = 1200;

function getUserSettings(botData, userId) {
    botData.statusSettings ||= {};
    botData.statusSettings[userId] ||= {};
    const userSettings = botData.statusSettings[userId];
    userSettings.autoReplyRules = Array.isArray(userSettings.autoReplyRules)
        ? userSettings.autoReplyRules.filter(rule => typeof rule?.keyword === 'string' && typeof rule?.response === 'string' && rule.keyword.trim() && rule.response.trim())
        : [];
    userSettings.customAutoReplyEnabled = userSettings.customAutoReplyEnabled === true;
    return userSettings;
}

function normalizeKeyword(value) {
    return String(value).normalize('NFKC').toLocaleLowerCase();
}

function splitRuleDefinition(value) {
    const match = value.match(/\s*(\||=>|->)\s*/);
    if (!match) return null;
    const keyword = value.slice(0, match.index).trim();
    const response = value.slice(match.index + match[0].length).trim();
    return { keyword, response };
}

function helpText() {
    return `Use:\n.autoreply on|off|status\n.autoreply add <keyword> | <response>\n.autoreply remove <keyword>\n.autoreply list\n\nKeyword replies activate when you add a rule. Rules match whole words/phrases, ignore letter case, and are saved for this connected bot account.`;
}

module.exports = async function autoreplyCommand(sock, chatId, msg, isAdmin, session, args = [], botData = {}, saveBotData = () => {}, userId = session?.userId || 'default') {
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only the owner or an authorized group admin can manage auto-reply rules.' }, { quoted: msg });
    }

    const userSettings = getUserSettings(botData, userId);
    const action = String(args[0] || 'status').toLowerCase();

    if (action === 'on' || action === 'enable') {
        session.aiEnabled = true;
        session.customAutoReplyEnabled = true;
        userSettings.customAutoReplyEnabled = true;
        saveBotData();
        return sock.sendMessage(chatId, {
            text: '🩸 *AUTO-REPLY: ON*\n\nPrivate AI replies and saved keyword replies are enabled. Keyword rules can also be managed with `.autoreply add <keyword> | <response>`.'
        }, { quoted: msg });
    }

    if (action === 'off' || action === 'disable') {
        session.aiEnabled = false;
        session.customAutoReplyEnabled = false;
        userSettings.customAutoReplyEnabled = false;
        saveBotData();
        return sock.sendMessage(chatId, {
            text: '🔴 *AUTO-REPLY: OFF*\n\nAI and custom keyword auto-replies are disabled. Your saved keyword rules are kept until removed.'
        }, { quoted: msg });
    }

    if (action === 'add') {
        const definition = splitRuleDefinition(args.slice(1).join(' '));
        if (!definition?.keyword || !definition.response) {
            return sock.sendMessage(chatId, { text: '⚠️ ' + helpText() }, { quoted: msg });
        }
        if (definition.keyword.length > MAX_KEYWORD_LENGTH || definition.response.length > MAX_RESPONSE_LENGTH) {
            return sock.sendMessage(chatId, { text: `❌ Keyword limit: ${MAX_KEYWORD_LENGTH} characters; response limit: ${MAX_RESPONSE_LENGTH} characters.` }, { quoted: msg });
        }
        const duplicate = userSettings.autoReplyRules.some(rule => normalizeKeyword(rule.keyword) === normalizeKeyword(definition.keyword));
        if (duplicate) return sock.sendMessage(chatId, { text: `ℹ️ A reply for “${definition.keyword}” already exists. Remove it first if you want to change it.` }, { quoted: msg });
        if (userSettings.autoReplyRules.length >= MAX_RULES) {
            return sock.sendMessage(chatId, { text: `❌ Maximum ${MAX_RULES} keyword rules reached. Remove one before adding another.` }, { quoted: msg });
        }
        userSettings.autoReplyRules.push(definition);
        userSettings.customAutoReplyEnabled = true;
        session.customAutoReplyEnabled = true;
        saveBotData();
        return sock.sendMessage(chatId, { text: `✅ Auto-reply added and enabled.\nKeyword: *${definition.keyword}*\nReply: ${definition.response}` }, { quoted: msg });
    }

    if (action === 'remove' || action === 'delete') {
        const keyword = args.slice(1).join(' ').trim();
        if (!keyword) return sock.sendMessage(chatId, { text: 'Usage: `.autoreply remove <keyword>`' }, { quoted: msg });
        const index = userSettings.autoReplyRules.findIndex(rule => normalizeKeyword(rule.keyword) === normalizeKeyword(keyword));
        if (index < 0) return sock.sendMessage(chatId, { text: `ℹ️ No auto-reply rule found for “${keyword}”.` }, { quoted: msg });
        userSettings.autoReplyRules.splice(index, 1);
        if (!userSettings.autoReplyRules.length) {
            userSettings.customAutoReplyEnabled = false;
            session.customAutoReplyEnabled = false;
        }
        saveBotData();
        return sock.sendMessage(chatId, { text: `✅ Auto-reply rule removed: *${keyword}*` }, { quoted: msg });
    }

    if (action === 'list') {
        const rules = userSettings.autoReplyRules;
        const lines = rules.length
            ? rules.map((rule, index) => `${index + 1}. *${rule.keyword}* → ${rule.response}`).join('\n')
            : 'No custom keyword rules yet.';
        return sock.sendMessage(chatId, { text: `📝 *AUTO-REPLY RULES* (${rules.length}/${MAX_RULES})\nStatus: *${userSettings.customAutoReplyEnabled ? 'ON' : 'OFF'}*\n\n${lines}` }, { quoted: msg });
    }

    if (action !== 'status') return sock.sendMessage(chatId, { text: helpText() }, { quoted: msg });
    return sock.sendMessage(chatId, {
        text: `🩸 *AUTO-REPLY STATUS*\n\nPrivate AI replies: *${session.aiEnabled ? 'ON' : 'OFF'}*\nCustom keyword replies: *${userSettings.customAutoReplyEnabled ? 'ON' : 'OFF'}*\nSaved rules: *${userSettings.autoReplyRules.length}*\n\n${helpText()}`
    }, { quoted: msg });
};

module.exports.splitRuleDefinition = splitRuleDefinition;
module.exports.MAX_RULES = MAX_RULES;
