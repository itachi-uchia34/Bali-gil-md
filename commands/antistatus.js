async function antistatusCommand(sock, from, msg, isAdmin, botData, saveBotData, args) {
    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: "❌ This command only works in groups." }, { quoted: msg });
    if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only admins can use this command." }, { quoted: msg });

    const action = args[0]?.toLowerCase();
    if (!botData.antiStatusGroups) botData.antiStatusGroups = {};

    if (action === 'on') {
        botData.antiStatusGroups[from] = true;
        saveBotData();
        await sock.sendMessage(from, { text: "✅ *Anti-Status Enabled!*\n\nAny status shared in this group will be automatically deleted." }, { quoted: msg });
    } else if (action === 'off') {
        botData.antiStatusGroups[from] = false;
        saveBotData();
        await sock.sendMessage(from, { text: "❌ *Anti-Status Disabled!*" }, { quoted: msg });
    } else {
        await sock.sendMessage(from, { text: "❌ Usage: .antistatus [on/off]" }, { quoted: msg });
    }
}

module.exports = antistatusCommand;
