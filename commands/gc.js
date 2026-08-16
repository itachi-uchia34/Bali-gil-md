// commands/gc.js
// .GC on / .GC off command
// Usage: .GC on  - enable GC mode for this chat (admins only)
//        .GC off - disable GC mode for this chat
//        .GC status - show current GC status

async function gcCommand(sock, from, msg, isAdmin, session, args = []) {
  // Restrict to group admins
  if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only group admins can use this command." }, { quoted: msg });

  // Ensure session.gc object exists
  if (!session.gc) session.gc = { enabled: false };

  const action = (args[0] || '').toLowerCase();

  if (action === 'on') {
    session.gc.enabled = true;
    await sock.sendMessage(from, { text: '✅ GC mode has been ENABLED for this chat.' }, { quoted: msg });
  } else if (action === 'off') {
    session.gc.enabled = false;
    await sock.sendMessage(from, { text: '❌ GC mode has been DISABLED for this chat.' }, { quoted: msg });
  } else if (action === 'status') {
    const status = session.gc.enabled ? '✅ Enabled' : '❌ Disabled';
    await sock.sendMessage(from, { text: `📊 GC Status: ${status}` }, { quoted: msg });
  } else {
    await sock.sendMessage(from, {
      text: `❌ Usage: .GC [on|off|status]\n\n• on     - Enable GC mode for this chat (admins only)\n• off    - Disable GC mode for this chat\n• status - Show current GC status`
    }, { quoted: msg });
  }
}

module.exports = gcCommand;
