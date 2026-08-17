async function autoreactsCommand(sock, from, msg, isAdmin, session, args, botData, saveBotData) {
    if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only owner can use this command." }, { quoted: msg });

    const action = String(args[0] || '').trim().toLowerCase();
    if (action !== 'on' && action !== 'off') {
        await sock.sendMessage(from, { text: "❌ Usage: .autoreacts [on/off]" }, { quoted: msg });
        return;
    }

    const enabled = action === 'on';
    session.autoReact = enabled;

    // Persist the setting so it survives a restart or a reconnect.
    const userId = session.userId;
    if (botData && userId) {
        botData.statusSettings ||= {};
        botData.statusSettings[userId] ||= {};
        botData.statusSettings[userId].autoReact = enabled;
        if (typeof saveBotData === 'function') saveBotData();
    }

    await sock.sendMessage(
        from,
        { text: enabled ? "✅ Auto-React Enabled! All configured emojis will rotate." : "❌ Auto-React Disabled!" },
        { quoted: msg }
    );
}

module.exports = autoreactsCommand;
