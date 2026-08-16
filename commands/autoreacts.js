// commands/autoreacts.js
// Auto-React Command for MD Bot — improved to use all emojis across different messages
// Features added/changed:
// - Default mode set to 'rotating' so the pool cycles through every emoji on successive messages
// - Avoids repeating the same emoji for consecutive messages in the same chat
// - New subcommands: mode, remove, list
// - Prevent duplicate emojis in the pool when adding

async function autoreactsCommand(sock, from, msg, isAdmin, session, args = []) {
    if (!isAdmin) {
        return await sock.sendMessage(from, {
            text: "❌ Only group admins can use this command."
        }, { quoted: msg });
    }

    // Initialize session.autoReact if missing or old structure
    if (!session.autoReact || typeof session.autoReact.mode === 'undefined') {
        session.autoReact = {
            enabled: false,
            mode: 'rotating', // Changed default to rotating so we use all emojis across messages
            emojis: ['✅', '❤️', '👏', '🔥', '🎉', '💕', '💯', '😡', '✨', '🚀', '😂', '👀', '👍', '🌟', '💎', '🎈'],
            reactions: {}, // keyword specific mapping: { keyword: emoji }
            rotatingIndex: 0,
            lastByChat: {} // track last reaction used per chat to avoid immediate repeats
        };
    }

    const action = args[0]?.toLowerCase();

    if (action === 'on') {
        session.autoReact.enabled = true;
        // Accept optional second arg for mode or a fixed emoji
        const opt = args[1];
        if (opt) {
            if (['random', 'rotating', 'default'].includes(opt.toLowerCase())) {
                session.autoReact.mode = opt.toLowerCase();
                await sock.sendMessage(from, {
                    text: `✅ Auto-React Enabled! Mode: ${session.autoReact.mode.toUpperCase()}`
                }, { quoted: msg });
            } else {
                // Treat as a fixed emoji
                session.autoReact.mode = 'default';
                session.autoReact.defaultEmoji = opt;
                await sock.sendMessage(from, {
                    text: `✅ Auto-React Enabled! Mode: Fixed Emoji (${opt})`
                }, { quoted: msg });
            }
        } else {
            // No option -> keep current mode (default rotating)
            await sock.sendMessage(from, {
                text: `✅ Auto-React Enabled! Mode: ${session.autoReact.mode.toUpperCase()}`
            }, { quoted: msg });
        }
    } else if (action === 'off') {
        session.autoReact.enabled = false;
        await sock.sendMessage(from, { text: "❌ Auto-React Disabled!" }, { quoted: msg });
    } else if (action === 'add') {
        const newEmoji = args[1];
        if (!newEmoji) return await sock.sendMessage(from, { text: "❌ Usage: .autoreact add [emoji]" }, { quoted: msg });
        session.autoReact.emojis = session.autoReact.emojis || [];
        if (session.autoReact.emojis.includes(newEmoji)) {
            return await sock.sendMessage(from, { text: `⚠️ ${newEmoji} is already in the emoji pool.` }, { quoted: msg });
        }
        session.autoReact.emojis.push(newEmoji);
        await sock.sendMessage(from, { text: `✅ Added ${newEmoji} to the emoji pool.` }, { quoted: msg });
    } else if (action === 'remove') {
        const emoji = args[1];
        if (!emoji) return await sock.sendMessage(from, { text: "❌ Usage: .autoreact remove [emoji]" }, { quoted: msg });
        session.autoReact.emojis = session.autoReact.emojis || [];
        const idx = session.autoReact.emojis.indexOf(emoji);
        if (idx === -1) return await sock.sendMessage(from, { text: `⚠️ ${emoji} not found in pool.` }, { quoted: msg });
        session.autoReact.emojis.splice(idx, 1);
        await sock.sendMessage(from, { text: `✅ Removed ${emoji} from the emoji pool.` }, { quoted: msg });
    } else if (action === 'reset') {
        session.autoReact.emojis = ['✅', '❤️', '👏', '🔥', '🎉', '💕', '💯', '😡', '✨', '🚀', '😂', '👀', '👍', '🌟', '💎', '🎈'];
        session.autoReact.rotatingIndex = 0;
        session.autoReact.lastByChat = {};
        await sock.sendMessage(from, { text: "✅ Emoji pool reset to default list." }, { quoted: msg });
    } else if (action === 'status') {
        const status = session.autoReact.enabled ? '✅ Enabled' : '❌ Disabled';
        const mode = session.autoReact.mode;
        const count = (session.autoReact.emojis || []).length;
        await sock.sendMessage(from, {
            text: `📊 *Auto-React Status*\nStatus: ${status}\nMode: ${mode}\nEmoji Pool Size: ${count} emojis`
        }, { quoted: msg });
    } else if (action === 'mode') {
        const mode = args[1]?.toLowerCase();
        if (!mode || !['random', 'rotating', 'default'].includes(mode)) {
            return await sock.sendMessage(from, { text: "❌ Usage: .autoreact mode [random|rotating|default]" }, { quoted: msg });
        }
        session.autoReact.mode = mode;
        await sock.sendMessage(from, { text: `✅ Mode set to ${mode.toUpperCase()}` }, { quoted: msg });
    } else if (action === 'list') {
        const pool = session.autoReact.emojis || [];
        await sock.sendMessage(from, { text: `🎯 Emoji pool (${pool.length}): ${pool.join(' ')}` }, { quoted: msg });
    } else {
        await sock.sendMessage(from, {
            text: `❌ *Usage:* .autoreact [on/off/add/remove/reset/status/mode/list]\n\n` +
                  `• on [mode|emoji] - Enable auto-react (modes: random, rotating, default)\n` +
                  `• off - Disable auto-react\n` +
                  `• add [emoji] - Add an emoji to the pool\n` +
                  `• remove [emoji] - Remove an emoji from the pool\n` +
                  `• reset - Reset pool to defaults\n` +
                  `• status - Show current settings\n` +
                  `• mode [random|rotating|default] - Set selection mode\n` +
                  `• list - Show all emojis in the pool`
        }, { quoted: msg });
    }
}

/**
 * Message handler to process auto-reactions.
 * Called on every incoming message (from = chat id, msg = message object, session = chat/session state)
 */
async function handleAutoReact(sock, from, msg, session) {
    if (!session || !session.autoReact || !session.autoReact.enabled) return;

    const config = session.autoReact;
    config.emojis = config.emojis || [];
    config.lastByChat = config.lastByChat || {};

    let reaction = null;

    // 1) Keyword reactions
    const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "")?.toLowerCase();
    if (text && config.reactions) {
        for (const [kw, emo] of Object.entries(config.reactions)) {
            if (text.includes(kw.toLowerCase())) {
                reaction = emo;
                break;
            }
        }
    }

    // 2) If no keyword reaction, use pool according to mode
    if (!reaction) {
        const pool = config.emojis;
        if (!pool || pool.length === 0) return; // nothing to react with

        const last = config.lastByChat[from];

        if (config.mode === 'rotating') {
            // Ensure rotatingIndex exists
            config.rotatingIndex = config.rotatingIndex || 0;
            // pick next emoji; if same as last, advance one more slot
            let candidate = pool[config.rotatingIndex % pool.length];
            if (candidate === last) {
                // advance one to avoid repeat
                candidate = pool[(config.rotatingIndex + 1) % pool.length];
                config.rotatingIndex = (config.rotatingIndex + 2) % pool.length;
            } else {
                config.rotatingIndex = (config.rotatingIndex + 1) % pool.length;
            }
            reaction = candidate;
        } else if (config.mode === 'random' || !config.mode) {
            // Random but avoid immediate repeat
            let candidate = pool[Math.floor(Math.random() * pool.length)];
            const maxTries = 6;
            let tries = 0;
            while (candidate === last && tries < maxTries && pool.length > 1) {
                candidate = pool[Math.floor(Math.random() * pool.length)];
                tries++;
            }
            reaction = candidate;
        } else if (config.mode === 'default') {
            reaction = config.defaultEmoji || pool[0];
            // If default equals last and pool has alternatives, pick first non-last
            if (reaction === last && pool.length > 1) {
                reaction = pool.find(e => e !== last) || reaction;
            }
        } else {
            // fallback
            reaction = pool[Math.floor(Math.random() * pool.length)];
        }

        // Save last reaction for this chat to prevent immediate repeats
        if (reaction) config.lastByChat[from] = reaction;
    }

    // 3) Send reaction (WhatsApp Web/BAILEYS react structure)
    if (reaction) {
        try {
            await sock.sendMessage(from, {
                react: { text: reaction, key: msg.key }
            });
        } catch (e) {
            console.error('AutoReact Error:', e);
        }
    }
}

// Attach handler so the bot can call it from the message event loop
autoreactsCommand.handleAutoReact = handleAutoReact;
module.exports = autoreactsCommand;
