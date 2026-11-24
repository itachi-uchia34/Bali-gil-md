const crypto = require('crypto');

function reply(sock, from, msg, text) {
    return sock.sendMessage(from, { text }, { quoted: msg });
}

async function time(sock, from, msg) {
    const now = new Date();
    return reply(sock, from, msg, `🕰️ *REALITY CLOCK*\n\n📅 ${now.toLocaleDateString()}\n⏰ ${now.toLocaleTimeString()}\n🌑 Every second shapes the battlefield.`);
}

async function date(sock, from, msg) {
    const now = new Date();
    return reply(sock, from, msg, `📜 *TODAY'S DECREE*\n\n${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
}

async function choose(sock, from, msg, q) {
    const options = (q || '').split('|').map(value => value.trim()).filter(Boolean);
    if (options.length < 2) return reply(sock, from, msg, 'Usage: .choose Option 1 | Option 2 | Option 3');
    const selected = options[Math.floor(Math.random() * options.length)];
    return reply(sock, from, msg, `⚔️ *BALI GIL HAS CHOSEN*\n\n${selected}`);
}

async function eightball(sock, from, msg, q) {
    const answers = ['The path is clear.', 'Reality rejects this plan.', 'The answer lies in patience.', 'Your victory is possible, but sacrifice is required.', 'Ask again when your resolve is stronger.', 'The Infinite Tsukuyomi says yes.'];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    return reply(sock, from, msg, `🔮 *SHARINGAN ORACLE*\n\n❓ ${q || 'Your question'}\n\n👁️ ${answer}`);
}

async function motivate(sock, from, msg) {
    const lines = ['Rise above the chaos.', 'Your limits are only another battlefield.', 'Endure the darkness and command the light.', 'Strength is built when surrender is refused.', 'A true shinobi turns pressure into power.'];
    return reply(sock, from, msg, `🔥 *BALI GIL'S DECREE*\n\n${lines[Math.floor(Math.random() * lines.length)]}`);
}

async function password(sock, from, msg, q) {
    const requested = Number.parseInt(q, 10);
    const length = Math.min(32, Math.max(8, Number.isFinite(requested) ? requested : 12));
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const bytes = crypto.randomBytes(length);
    let value = '';
    for (let index = 0; index < length; index++) value += alphabet[bytes[index] % alphabet.length];
    return reply(sock, from, msg, `🔐 *SECRET SEAL GENERATED*\n\n\`${value}\`\n\nLength: ${length}`);
}

async function uuid(sock, from, msg) {
    return reply(sock, from, msg, `🆔 *SHINOBI IDENTIFIER*\n\n\`${crypto.randomUUID()}\``);
}

async function color(sock, from, msg) {
    const value = `#${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    return reply(sock, from, msg, `🎨 *CHAKRA COLOR*\n\n\`${value}\``);
}

async function dice(sock, from, msg, q) {
    const sides = Math.min(100, Math.max(2, Number.parseInt(q, 10) || 6));
    const result = crypto.randomInt(1, sides + 1);
    return reply(sock, from, msg, `🎲 *BATTLEFIELD DICE*\n\nSides: ${sides}\nResult: *${result}*`);
}

async function countdown(sock, from, msg, q) {
    const target = new Date(q || '');
    if (Number.isNaN(target.getTime())) return reply(sock, from, msg, 'Usage: .countdown 2026-12-31');
    const days = Math.ceil((target.getTime() - Date.now()) / 86400000);
    return reply(sock, from, msg, `⏳ *COUNTDOWN TO THE DECREE*\n\n${days >= 0 ? `${days} days remain.` : 'That date has already fallen into history.'}`);
}

module.exports = { time, date, choose, eightball, motivate, password, uuid, color, dice, countdown };
