// commands/group.js
// Group admin utilities: lock/unlock, slowmode, mute/unmute, antilink toggle
// Usage examples:
// .lock / .unlock
// .slowmode <seconds>
// .mute @user / .unmute @user
// .antilink on / .antilink off

async function groupCommand(sock, from, msg, isAdmin, session, args = []) {
  const action = (args[0] || '').toLowerCase();
  if (!isAdmin) return await sock.sendMessage(from, { text: '❌ Only group admins can use these commands.' }, { quoted: msg });

  session.groupConfig = session.groupConfig || { locked: false, slowmode: 0, muted: {}, antilink: false };

  if (action === 'lock') {
    session.groupConfig.locked = true;
    return await sock.sendMessage(from, { text: '🔒 Group locked. Only admins can send messages now.' }, { quoted: msg });
  }
  if (action === 'unlock') {
    session.groupConfig.locked = false;
    return await sock.sendMessage(from, { text: '🔓 Group unlocked. All members can send messages.' }, { quoted: msg });
  }

  if (action === 'slowmode') {
    const seconds = parseInt(args[1], 10) || 0;
    session.groupConfig.slowmode = Math.max(0, seconds);
    return await sock.sendMessage(from, { text: `🐢 Slowmode set to ${session.groupConfig.slowmode} seconds.` }, { quoted: msg });
  }

  if (action === 'mute') {
    // expect mention or jid
    const target = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid && msg.message.extendedTextMessage.contextInfo.mentionedJid[0]) || args[1];
    if (!target) return await sock.sendMessage(from, { text: '❌ Usage: .mute @user' }, { quoted: msg });
    session.groupConfig.muted = session.groupConfig.muted || {};
    session.groupConfig.muted[target] = true;
    return await sock.sendMessage(from, { text: `🔇 ${target} has been muted.` }, { quoted: msg });
  }

  if (action === 'unmute') {
    const target = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid && msg.message.extendedTextMessage.contextInfo.mentionedJid[0]) || args[1];
    if (!target) return await sock.sendMessage(from, { text: '❌ Usage: .unmute @user' }, { quoted: msg });
    session.groupConfig.muted = session.groupConfig.muted || {};
    delete session.groupConfig.muted[target];
    return await sock.sendMessage(from, { text: `🔊 ${target} has been unmuted.` }, { quoted: msg });
  }

  if (action === 'antilink') {
    const sub = (args[1] || '').toLowerCase();
    if (sub === 'on') {
      session.groupConfig.antilink = true;
      return await sock.sendMessage(from, { text: '🚫 Antilink ENABLED for this group.' }, { quoted: msg });
    }
    if (sub === 'off') {
      session.groupConfig.antilink = false;
      return await sock.sendMessage(from, { text: '✅ Antilink DISABLED for this group.' }, { quoted: msg });
    }
    return await sock.sendMessage(from, { text: '❌ Usage: .antilink [on|off]' }, { quoted: msg });
  }

  // help
  await sock.sendMessage(from, { text: `❌ Group command usage:\n.lock / .unlock\n.slowmode <seconds>\n.mute @user / .unmute @user\n.antilink on/off` }, { quoted: msg });
}

module.exports = groupCommand;
