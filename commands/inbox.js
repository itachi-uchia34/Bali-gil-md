// commands/inbox.js
// Admin-only inbox management for reports stored in session.adminInbox
// Usage:
// .inbox          - show summary (count, latest few)
// .inbox view <id> - show full report
// .inbox clear    - clear all reports for the group

async function inboxCommand(sock, from, msg, isAdmin, session, args = []) {
  if (!isAdmin) return await sock.sendMessage(from, { text: '❌ Only group admins can use this command.' }, { quoted: msg });

  session.adminInbox = session.adminInbox || [];
  const action = (args[0] || '').toLowerCase();

  if (!action) {
    // show summary
    const total = session.adminInbox.length;
    if (total === 0) return await sock.sendMessage(from, { text: '📭 No reports in the inbox.' }, { quoted: msg });

    const latest = session.adminInbox.slice(-5).map(r => `#${r.id} from @${r.from.split('@')[0]} at ${r.at} - ${r.text.slice(0,40)}...`).join('\n');
    await sock.sendMessage(from, { text: `📭 Reports: ${total}\nLatest:\n${latest}` }, { quoted: msg });
    return;
  }

  if (action === 'view') {
    const id = parseInt(args[1], 10);
    if (!id) return await sock.sendMessage(from, { text: '❌ Usage: .inbox view <id>' }, { quoted: msg });
    const item = session.adminInbox.find(r => r.id === id);
    if (!item) return await sock.sendMessage(from, { text: `❌ Report #${id} not found.` }, { quoted: msg });
    await sock.sendMessage(from, { text: `📮 Report #${item.id}\nFrom: @${item.from.split('@')[0]}\nAt: ${item.at}\n\n${item.text}` }, { quoted: msg });
    return;
  }

  if (action === 'clear') {
    session.adminInbox = [];
    await sock.sendMessage(from, { text: '🧹 Inbox cleared.' }, { quoted: msg });
    return;
  }

  // default help
  await sock.sendMessage(from, { text: `❌ Usage: .inbox [view <id>|clear]\n• .inbox - summary\n• .inbox view <id> - full report\n• .inbox clear - clear all reports` }, { quoted: msg });
}

module.exports = inboxCommand;
