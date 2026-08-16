// commands/welcome.js
// Enhanced welcome command with toggles and custom templates
// Commands:
// .welcome on/off - enable or disable welcome messages
// .setwelcome <text> - set welcome template (use placeholders: @user, @gname, @count, @desc)
// .welcome test - send a test welcome to show formatting
// If no args: sends the currently configured welcome to a target (replied user or sender)

async function welcomeCommand(sock, from, msg, isAdmin, session, args = []) {
  // only allow admins to change settings
  const sub = (args[0] || '').toLowerCase();
  session.welcome = session.welcome || { enabled: false, template: null };

  if (sub === 'on') {
    if (!isAdmin) return await sock.sendMessage(from, { text: '❌ Only group admins can enable welcome.' }, { quoted: msg });
    session.welcome.enabled = true;
    return await sock.sendMessage(from, { text: '✅ Welcome messages ENABLED for this group.' }, { quoted: msg });
  }
  if (sub === 'off') {
    if (!isAdmin) return await sock.sendMessage(from, { text: '❌ Only group admins can disable welcome.' }, { quoted: msg });
    session.welcome.enabled = false;
    return await sock.sendMessage(from, { text: '❌ Welcome messages DISABLED for this group.' }, { quoted: msg });
  }

  if (sub === 'setwelcome') {
    if (!isAdmin) return await sock.sendMessage(from, { text: '❌ Only group admins can set welcome.' }, { quoted: msg });
    const template = args.slice(1).join(' ').trim();
    if (!template) return await sock.sendMessage(from, { text: '❌ Usage: .setwelcome <template> (placeholders: @user,@gname,@count,@desc)' }, { quoted: msg });
    session.welcome.template = template;
    return await sock.sendMessage(from, { text: '✅ Welcome template saved.' }, { quoted: msg });
  }

  if (sub === 'test') {
    // anyone can test
    return await sendWelcome(sock, from, msg, session, true);
  }

  // default: send welcome if enabled or send custom
  return await sendWelcome(sock, from, msg, session, false);
}

async function sendWelcome(sock, from, msg, session, isTest = false) {
  // Fetch metadata
  let metadata = {};
  try {
    if (sock.groupMetadata) metadata = await sock.groupMetadata(from);
    else if (sock.fetchGroupMetadata) metadata = await sock.fetchGroupMetadata(from);
  } catch (e) { /* ignore */ }

  const groupName = metadata.subject || 'this group';
  const desc = metadata.desc || metadata.description || session.groupDesc || 'No description set.';
  const count = (metadata.participants || []).length || session.count || 0;

  // determine target user
  let target = null;
  const ctx = msg.message && msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo;
  if (ctx && ctx.participant) target = ctx.participant;
  else target = msg.key.participant || msg.key.remoteJid;

  const mention = target ? `@${target.split('@')[0]}` : '@user';

  const defaultTemplate = `🩸 *━───── 🔴 AKATSUKI MD 🔴 ─────━* 🩸\n\n*Welcome to the Shroud,* ${mention} 👋\n\n You have entered: *@${groupName}*\n 👥 *Ranks Count:* *@${count}* members\n\n📜 *ORGANIZATION LAWS:*\n${desc}\n\n> _"Those who do not understand true pain can never understand true peace."_\n\n⚔️ Put on the cloak, wear your ring, and obey the dynamic. Weakness will not be tolerated.`;

  const tpl = session.welcome.template || defaultTemplate;

  // replace placeholders
  const text = tpl.replace(/@user/g, mention).replace(/@gname/g, groupName).replace(/@count/g, String(count)).replace(/@desc/g, desc);

  if (!session.welcome.enabled && !isTest) {
    return await sock.sendMessage(from, { text: '❌ Welcome messages are disabled for this group. Use .welcome on to enable or .welcome test to preview.' }, { quoted: msg });
  }

  try {
    await sock.sendMessage(from, { text, mentions: target ? [target] : [] });
  } catch (e) {
    console.error('sendWelcome error', e);
    await sock.sendMessage(from, { text: 'Failed to send welcome message.' }, { quoted: msg });
  }
}

module.exports = welcomeCommand;
