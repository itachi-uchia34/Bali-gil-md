const axios = require('axios');

const DEFAULT_WELCOME = `╔═══〔 ⚔️ BALI GIL 〕═══╗

🩸 *A NEW SHINOBI HAS ENTERED THE REALM* 🩸

╭─────── ⋆⋅☆⋅⋆ ───────╮
  Welcome, {user}
╰─────── ⋆⋅☆⋅⋆ ───────╯

You are now part of *{group}*.

> _"Wake up to reality. Nothing ever goes as planned in this accursed world."_

👥 *Shinobi in the realm:* {count}
⚡ Respect the rules. Protect the realm.

╚════════════════════════╝`;

const DEFAULT_GOODBYE = `╔═══〔 ⚔️ BALI GIL 〕═══╗

🌑 *A SHINOBI HAS LEFT THE REALM*

Farewell {user}.
*{group}* will remember your presence.

> _"In this world, wherever there is light, there are also shadows."_

👥 Shinobi remaining: {count}
⚡ The realm moves on.

╚════════════════════════╝`;

const LEGACY_WELCOME = '👋 Welcome {user} to *{group}*!';
const LEGACY_GOODBYE = '👋 Goodbye {user}. You have left *{group}*.';

function getConfig(botData, groupId, defaults = {}) {
    if (!botData || !groupId) return null;
    if (!botData.welcomeSettings || typeof botData.welcomeSettings !== 'object') {
        botData.welcomeSettings = {};
    }

    const existing = botData.welcomeSettings[groupId];
    if (!existing || typeof existing !== 'object') {
        botData.welcomeSettings[groupId] = {};
    }

    const config = botData.welcomeSettings[groupId];
    if (typeof config.welcomeEnabled !== 'boolean') {
        config.welcomeEnabled = typeof defaults.welcomeEnabled === 'boolean' ? defaults.welcomeEnabled : false;
    }
    if (typeof config.goodbyeEnabled !== 'boolean') config.goodbyeEnabled = false;
    if (typeof config.welcomeText !== 'string' || !config.welcomeText.trim() || config.welcomeText === LEGACY_WELCOME) config.welcomeText = DEFAULT_WELCOME;
    if (typeof config.goodbyeText !== 'string' || !config.goodbyeText.trim() || config.goodbyeText === LEGACY_GOODBYE) config.goodbyeText = DEFAULT_GOODBYE;
    return config;
}

function render(template, values) {
    return String(template)
        .replaceAll('{user}', String(values.user || ''))
        .replaceAll('{name}', String(values.name || values.user || ''))
        .replaceAll('{group}', String(values.group || 'the group'))
        .replaceAll('{count}', String(values.count ?? ''));
}

function participantJid(participant) {
    if (typeof participant === 'string') return participant;
    if (!participant || typeof participant !== 'object') return null;
    return participant.id || participant.jid || participant.phoneNumber || null;
}

function normalizeParticipants(participants) {
    return [...new Set(
        (Array.isArray(participants) ? participants : [])
            .map(participantJid)
            .filter(jid => typeof jid === 'string' && jid.includes('@'))
    )];
}

function usage(prefix, type) {
    return [
        `*${type[0].toUpperCase()}${type.slice(1)} Settings*`,
        '',
        `${prefix}${type} on`,
        `${prefix}${type} off`,
        `${prefix}${type} text <message>`,
        `${prefix}${type} reset`,
        '',
        'Placeholders: {user}, {name}, {group}, {count}'
    ].join('\n');
}

async function sendSettingReply(sock, from, msg, text) {
    return sock.sendMessage(from, { text }, msg ? { quoted: msg } : {});
}

async function updateSetting(sock, from, msg, isAdmin, q, botData, saveBotData, type) {
    if (!from || !from.endsWith('@g.us')) {
        return sendSettingReply(sock, from, msg, '❌ This command can only be used in groups.');
    }
    if (!isAdmin) {
        return sendSettingReply(sock, from, msg, '❌ Only group admins can change welcome settings.');
    }

    const config = getConfig(botData, from);
    const args = String(q || '').trim();
    const [rawAction, ...rest] = args.split(/\s+/).filter(Boolean);
    const action = String(rawAction || '').toLowerCase();
    const text = rest.join(' ').trim();
    const enabledKey = type === 'welcome' ? 'welcomeEnabled' : 'goodbyeEnabled';
    const textKey = type === 'welcome' ? 'welcomeText' : 'goodbyeText';

    // `.welcome` and `.goodbye` are convenient aliases for enabling the feature.
    if (!action || action === 'enable') {
        config[enabledKey] = true;
        if (typeof saveBotData === 'function') saveBotData();
        return sendSettingReply(sock, from, msg, `✅ ${type} messages enabled. Automatic group events are active.`);
    }

    if (action === 'on' || action === 'off') {
        config[enabledKey] = action === 'on';
        if (typeof saveBotData === 'function') saveBotData();
        return sendSettingReply(sock, from, msg, `✅ ${type} messages ${config[enabledKey] ? 'enabled. Automatic group events are active' : 'disabled'}.`);
    }

    if (action === 'reset') {
        config[textKey] = type === 'welcome' ? DEFAULT_WELCOME : DEFAULT_GOODBYE;
        if (typeof saveBotData === 'function') saveBotData();
        return sendSettingReply(sock, from, msg, `✅ ${type} message reset to the default template.`);
    }

    if (action === 'text' && text) {
        config[textKey] = text;
        if (typeof saveBotData === 'function') saveBotData();
        return sendSettingReply(sock, from, msg, `✅ Custom ${type} message saved.`);
    }

    return sendSettingReply(sock, from, msg, usage('.', type));
}

async function welcomeCommand(sock, from, msg, isAdmin, q, botData, saveBotData) {
    return updateSetting(sock, from, msg, isAdmin, q, botData, saveBotData, 'welcome');
}

async function goodbyeCommand(sock, from, msg, isAdmin, q, botData, saveBotData) {
    return updateSetting(sock, from, msg, isAdmin, q, botData, saveBotData, 'goodbye');
}

async function configCommand(sock, from, msg, isAdmin, botData) {
    if (!from || !from.endsWith('@g.us')) {
        return sendSettingReply(sock, from, msg, '❌ This command can only be used in groups.');
    }
    if (!isAdmin) {
        return sendSettingReply(sock, from, msg, '❌ Only group admins can view welcome settings.');
    }

    const config = getConfig(botData, from);
    const text = [
        '*Welcome & Goodbye Configuration*',
        '',
        `Welcome: ${config.welcomeEnabled ? '✅ ON' : '❌ OFF'}`,
        `Goodbye: ${config.goodbyeEnabled ? '✅ ON' : '❌ OFF'}`,
        '',
        `Welcome text: ${config.welcomeText}`,
        `Goodbye text: ${config.goodbyeText}`
    ].join('\n');
    return sendSettingReply(sock, from, msg, text);
}

async function handleParticipantUpdate(sock, update, botData, saveBotData, options = {}) {
    if (!sock || !update || !update.id) return;
    const action = update.action === 'invite' ? 'add' : update.action;
    if (action !== 'add' && action !== 'remove') return;

    const participants = normalizeParticipants(update.participants);
    if (!participants.length) return;

    const hadExplicitWelcomeSetting = typeof botData?.welcomeSettings?.[update.id]?.welcomeEnabled === 'boolean';
    const config = getConfig(botData, update.id, { welcomeEnabled: options.defaultWelcomeEnabled });
    if (!config) return;
    if (!hadExplicitWelcomeSetting && typeof options.defaultWelcomeEnabled === 'boolean' && typeof saveBotData === 'function') {
        try { saveBotData(); } catch (_) {}
    }
    const enabled = action === 'add' ? config.welcomeEnabled : config.goodbyeEnabled;
    if (!enabled) return;

    let metadata;
    try {
        metadata = await withTimeout(() => sock.groupMetadata(update.id), 4000, 'Group metadata lookup');
    } catch (error) {
        metadata = null;
    }

    const group = metadata?.subject || update.id.split('@')[0] || 'the group';
    const count = Array.isArray(metadata?.participants) ? metadata.participants.length : '';
    const template = action === 'add' ? config.welcomeText : config.goodbyeText;
    for (const jid of participants) {
        const user = `@${jid.split('@')[0]}`;
        const text = `🩸 *BALI GIL • AKATSUKI SHROUD* 🩸\n\n${render(template, { user, name: user, group, count })}\n\n_The realm welcomes you._`;
        let sentWithAvatar = false;

        if (action === 'add' && typeof sock.profilePictureUrl === 'function') {
            try {
                const avatarUrl = await withTimeout(() => sock.profilePictureUrl(jid, 'image'), 3500, 'Profile picture lookup');
                if (avatarUrl) {
                    const response = await axios.get(avatarUrl, {
                        responseType: 'arraybuffer',
                        timeout: 5000,
                        maxContentLength: 5 * 1024 * 1024,
                        maxBodyLength: 5 * 1024 * 1024
                    });
                    const avatar = Buffer.from(response.data);
                    if (avatar.length > 0 && avatar.length <= 5 * 1024 * 1024) {
                        const responseType = String(response.headers?.['content-type'] || '').split(';')[0].trim();
                        const mimetype = responseType.startsWith('image/') ? responseType : 'image/jpeg';
                        await sock.sendMessage(update.id, { image: avatar, mimetype, caption: text, mentions: [jid] });
                        sentWithAvatar = true;
                    }
                }
            } catch (_) {
                // Continue with a text welcome if the user's photo is private or unavailable.
            }
        }

        if (!sentWithAvatar) await sock.sendMessage(update.id, { text, mentions: [jid] });
    }
}

async function withTimeout(request, timeoutMs, label) {
    let timer;
    try {
        return await Promise.race([
            Promise.resolve().then(request),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
            })
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

module.exports = {
    DEFAULT_WELCOME,
    DEFAULT_GOODBYE,
    getConfig,
    normalizeParticipants,
    welcomeCommand,
    goodbyeCommand,
    configCommand,
    handleParticipantUpdate,
    withTimeout
};
