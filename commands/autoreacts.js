const { AUTO_REACT_EMOJIS, getAutoReactEmojiList } = require('../lib/auto-react');

async function autoreactsCommand(sock, from, msg, isAdmin, session, args = [], botData, saveBotData) {
    if (!isAdmin) {
        return sock.sendMessage(from, { text: '❌ Only the bot owner or a group admin can use this command.' }, { quoted: msg });
    }

    const action = String(args?.[0] || 'status').trim().toLowerCase();
    if (!['on', 'off', 'status'].includes(action)) {
        return sock.sendMessage(from, {
            text: `❌ Usage: .autoreact on/off/status\n\nAvailable reaction emojis (${AUTO_REACT_EMOJIS.length}):\n${getAutoReactEmojiList()}`
        }, { quoted: msg });
    }

    if (action === 'status') {
        const state = session?.autoReact ? 'ON' : 'OFF';
        return sock.sendMessage(from, {
            text: `🤖 Auto-React is ${state}.\nIt rotates one emoji per incoming message.\n\nAvailable reaction emojis (${AUTO_REACT_EMOJIS.length}):\n${getAutoReactEmojiList()}`
        }, { quoted: msg });
    }

    if (!session) {
        return sock.sendMessage(from, { text: '❌ Auto-React could not access this bot session. Please try again.' }, { quoted: msg });
    }

    const enabled = action === 'on';
    session.autoReact = enabled;

    const userId = session.userId;
    if (botData && userId) {
        botData.statusSettings ||= {};
        botData.statusSettings[userId] ||= {};
        botData.statusSettings[userId].autoReact = enabled;
        if (typeof saveBotData === 'function') saveBotData();
    }

    return sock.sendMessage(from, {
        text: `${enabled ? '✅ Auto-React enabled' : '❌ Auto-React disabled'}. ${enabled ? 'One emoji will rotate on each incoming message.' : ''}\n\nAvailable reaction emojis (${AUTO_REACT_EMOJIS.length}):\n${getAutoReactEmojiList()}`
    }, { quoted: msg });
}

module.exports = autoreactsCommand;
