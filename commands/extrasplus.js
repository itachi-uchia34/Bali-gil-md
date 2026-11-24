const settings = require('../settings');

function send(sock, from, msg, text, mentions = []) {
  return sock.sendMessage(from, { text, mentions }, { quoted: msg });
}

function isGroup(from) {
  return typeof from === 'string' && from.endsWith('@g.us');
}

async function about(sock, from, msg) {
  return send(sock, from, msg, `👁️ *ABOUT ${settings.botName}*\n\n⚔️ Owner: *${settings.ownerName}*\n📦 Version: *${settings.version}*\n🛡️ Style: *Madara Uchiha*\n⚡ Mode: *Fast command system*\n\n> Wake up to reality.\n\nPOWERED BY ${settings.poweredBy}`);
}

async function rules(sock, from, msg) {
  return send(sock, from, msg, `📜 *BALI GIL REALM RULES*\n\n┃ Respect every member\n┃ No spam, scams, or malicious links\n┃ No illegal or harmful content\n┃ Follow the group administrator's instructions\n┃ Use commands responsibly\n\n> Those who break the rules face the consequences.\n\nPOWERED BY ${settings.poweredBy}`);
}

async function groupid(sock, from, msg) {
  if (!isGroup(from)) return send(sock, from, msg, '❌ This command is available only in groups.');
  return send(sock, from, msg, `🆔 *GROUP ID*\n\n${from}`);
}

async function chatid(sock, from, msg) {
  return send(sock, from, msg, `🆔 *CHAT JID*\n\n${from}`);
}

async function mention(sock, from, msg, q) {
  const quoted = msg?.message?.extendedTextMessage?.contextInfo?.participant;
  const target = quoted || msg?.key?.participant || msg?.key?.remoteJid;
  if (!target) return send(sock, from, msg, '❌ Reply to a user or provide a valid message context.');
  const text = (q || 'You have been summoned by Madara.').trim();
  return send(sock, from, msg, `⚔️ @${target.split('@')[0]}\n\n${text}`, [target]);
}

async function randomtool(sock, from, msg, q) {
  const parts = String(q || '').trim().split(/\s+/).filter(Boolean).map(Number);
  let min = Number.isFinite(parts[0]) ? parts[0] : 1;
  let max = Number.isFinite(parts[1]) ? parts[1] : 100;
  if (min > max) [min, max] = [max, min];
  min = Math.ceil(min); max = Math.floor(max);
  if (max - min > 1000000) return send(sock, from, msg, '❌ The range cannot exceed one million values.');
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  return send(sock, from, msg, `🎲 *RANDOM VALUE*\n\nRange: *${min} – ${max}*\nResult: *${value}*`);
}

async function timestamp(sock, from, msg, q) {
  const date = q ? new Date(q) : new Date();
  if (Number.isNaN(date.getTime())) return send(sock, from, msg, '❌ Invalid date. Example: .timestamp 2026-08-20 14:30');
  return send(sock, from, msg, `🕒 *TIMESTAMP*\n\nISO: *${date.toISOString()}*\nUnix seconds: *${Math.floor(date.getTime() / 1000)}*\nUnix milliseconds: *${date.getTime()}*`);
}

async function urlencode(sock, from, msg, q) {
  if (!String(q || '').trim()) return send(sock, from, msg, 'Usage: .urlencode <text>');
  return send(sock, from, msg, `🔗 *URL ENCODED*\n\n${encodeURIComponent(q)}`);
}

async function hextext(sock, from, msg, q) {
  if (!String(q || '').trim()) return send(sock, from, msg, 'Usage: .hex <text>');
  const encoded = Buffer.from(q, 'utf8').toString('hex');
  return send(sock, from, msg, `🔢 *HEX RESULT*\n\n${encoded}`);
}

async function jsonfmt(sock, from, msg, q) {
  if (!String(q || '').trim()) return send(sock, from, msg, 'Usage: .jsonfmt <JSON text>');
  try {
    const formatted = JSON.stringify(JSON.parse(q), null, 2);
    return send(sock, from, msg, `🧾 *FORMATTED JSON*\n\n${formatted.slice(0, 3500)}`);
  } catch (_) {
    return send(sock, from, msg, '❌ Invalid JSON. Check commas, quotes, brackets, and braces.');
  }
}

async function textstats(sock, from, msg, q) {
  const text = String(q || '');
  if (!text.trim()) return send(sock, from, msg, 'Usage: .textstats <text>');
  const words = text.trim().split(/\s+/).length;
  const lines = text.split(/\r?\n/).length;
  return send(sock, from, msg, `📊 *TEXT STATISTICS*\n\nCharacters: *${text.length}*\nWords: *${words}*\nLines: *${lines}*\nBytes: *${Buffer.byteLength(text, 'utf8')}*`);
}

module.exports = { about, rules, groupid, chatid, mention, randomtool, timestamp, urlencode, hextext, jsonfmt, textstats };
