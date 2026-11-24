const os = require('os');
const settings = require('../settings');

function deny(sock, from, msg) {
    return sock.sendMessage(from, { text: '❌ This command is restricted to the bot owner.' }, { quoted: msg });
}

async function botinfo(sock, from, msg, isOwner) {
    if (!isOwner) return deny(sock, from, msg);
    const memory = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    return sock.sendMessage(from, { text: `⚔️ *BALI GIL MD BOT INFO*\n\n🤖 Bot: *${settings.botName}*\n👤 Owner: *${settings.ownerName}*\n📦 Version: *${settings.version}*\n🟢 Runtime: *${hours}h ${minutes}m ${seconds}s*\n🧠 Memory: *${memory} MB*\n🖥️ Platform: *${os.platform()} ${os.arch()}*\n🟣 Node: *${process.version}*\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️` }, { quoted: msg });
}

async function health(sock, from, msg, isOwner) {
    if (!isOwner) return deny(sock, from, msg);
    const started = Date.now();
    await sock.sendMessage(from, { text: `✅ *BOT HEALTH*\n\n⚡ Response check: *${Date.now() - started} ms*\n🟢 Process: *ONLINE*\n🔐 Owner control: *ACTIVE*\nPOWERED BY ⚔️ BALI GIL MD ⚔️` }, { quoted: msg });
}

async function ownerhelp(sock, from, msg, isOwner) {
    if (!isOwner) return deny(sock, from, msg);
    return sock.sendMessage(from, { text: `👑 *OWNER COMMANDS*\n\n.owner — show owner information\n.botinfo — show runtime and bot details\n.health — check bot health\n.backup — create bot backup\n.restore — restore bot data\n.broadcast <text> — broadcast a message\n
        .ownerpromote — promote the configured owner in a group when the bot is admin
        .safetymode status|on|off — view or control anti-abuse protection
.setchannel <jid-or-url> — set menu channel\n.removechannel — remove custom menu channel\n.jidfooter on|off|sender|chat|both — manage JID footer\n.public — enable public mode\n.private — enable private mode\n.restart — restart the bot\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️` }, { quoted: msg });
}

module.exports = { botinfo, health, ownerhelp };
