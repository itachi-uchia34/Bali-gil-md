async function kickOfflineCommand(sock, from, msg, isAdmin, botData = {}, saveBotData = () => {}, args = []) {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    }
    if (!isAdmin) {
        return sock.sendMessage(from, { text: '🩸 *AKATSUKI ACCESS DENIED*\nOnly group admins can issue this command.' }, { quoted: msg });
    }

    const action = String(args[0] || 'status').toLowerCase();
    botData.kickOffline ||= {};

    if (action === 'off' || action === 'disable') {
        botData.kickOffline[from] = false;
        saveBotData();
        return sock.sendMessage(from, { text: '✅ Automatic kick-offline is disabled.' }, { quoted: msg });
    }

    // Baileys/WhatsApp do not expose reliable historical last-seen data for group members.
    // Never pretend to enable an automated removal routine or risk removing the wrong people.
    botData.kickOffline[from] = false;
    saveBotData();
    return sock.sendMessage(from, {
        text: action === 'status'
            ? '⚠️ Automatic kick-offline is unavailable: WhatsApp does not provide reliable group-member last-seen history. No members will be removed.'
            : '⚠️ Kick-offline cannot be enabled safely because WhatsApp does not provide reliable group-member last-seen history. No members were removed. Use `.kickoffline off` to clear the setting.'
    }, { quoted: msg });
}

module.exports = kickOfflineCommand;
