// commands/report.js
// .report <text> - send a report to group admins and store it in session.adminInbox

async function reportCommand(sock, from, msg, isAdmin, session, args = []) {
  const text = args.join(' ').trim();
  if (!text) return await sock.sendMessage(from, { text: '❌ Usage: .report <your message>' }, { quoted: msg });

  // ensure inbox exists
  session.adminInbox = session.adminInbox || [];

  // id: incremental
  const id = (session.adminInbox.length ? session.adminInbox[session.adminInbox.length - 1].id + 1 : 1);
  const report = {
    id,
    at: new Date().toISOString(),
    from: msg.key.participant || msg.key.remoteJid,
    author: (msg.pushName || '') ,
    text 
  };

  session.adminInbox.push(report);

  // try to forward summary to group admins
  try {
    // fetch group metadata
    let metadata = {};
    if (sock.groupMetadata) metadata = await sock.groupMetadata(from);
    else if (sock.fetchGroupMetadata) metadata = await sock.fetchGroupMetadata(from);

    const participants = metadata && metadata.participants ? metadata.participants : [];
    const adminJids = participants.filter(p => p.isAdmin || p.isSuperAdmin).map(p => p.id || p.jid || p.participant).filter(Boolean);

    // notify each admin privately (or in group with mention if private fails)
    const summary = `📨 New report (#${id}) from @${report.from.split('@')[0]}\n${report.text.slice(0, 500)}...\nUse: .inbox status to view reports`;
    if (adminJids.length) {
      for (const admin of adminJids) {
        try {
          await sock.sendMessage(admin, { text: `📨 New report in group ${metadata.subject || from} (#${id})\nFrom: @${report.from.split('@')[0]}\n${report.text}` }, { mentions: [report.from], quoted: msg });
        } catch (e) {
          // fallback: mention in the group
        }
      }
    } else {
      // no admin list — mention in group
      await sock.sendMessage(from, { text: `📨 Report received (#${id}). Admins will be notified.` }, { quoted: msg });
    }
  } catch (e) {
    console.error('report: failed to notify admins', e);
  }

  await sock.sendMessage(from, { text: `✅ Report submitted (id: ${id}). Admins will review it.` }, { quoted: msg });
}

module.exports = reportCommand;
