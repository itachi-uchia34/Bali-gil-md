// commands/goodbye.js
// Adds a .goodbye command that sends a styled exile message in groups.
// Baileys-style implementation. Adapt if your bot uses another library.

module.exports = {
  name: 'goodbye',
  description: 'Send styled exile message to a user with group info',
  pattern: /^\.goodbye$/i,
  async execute(conn, message) {
    try {
      const jid = message.key.remoteJid;
      if (!jid || !jid.endsWith('@g.us')) {
        return await conn.sendMessage(message.key.remoteJid, { text: 'This command must be used in a group.' });
      }

      // Fetch group metadata (subject, participants)
      let metadata = {};
      try {
        metadata = await conn.groupMetadata(jid);
      } catch (e) {
        if (conn.fetchGroupMetadata) metadata = await conn.fetchGroupMetadata(jid);
      }

      const groupName = (metadata && metadata.subject) ? metadata.subject : 'this group';
      const count = (metadata && metadata.participants) ? metadata.participants.length : 0;

      // Determine target user to mention: replied user or the command sender
      let targetJid;
      const ctx = message.message && message.message.extendedTextMessage && message.message.extendedTextMessage.contextInfo;
      if (ctx && ctx.participant) {
        targetJid = ctx.participant;
      } else {
        targetJid = message.key.participant || message.key.remoteJid || (message.key && message.key.fromMe && conn.user && conn.user.jid);
      }

      const mentionText = targetJid ? `@${targetJid.split('@')[0]}` : '@user';

      const goodbyeText = `☁️ *━───── 🗡️ EXILE NOTICE 🗡️ ─────━* ☁️\n\n*An exile has departed...* \n\n👋 ${mentionText} has deserted *@${groupName}*.\n👥 *Remaining Ranks:* *@${count}*\n\n> _"True art is an explosion... and your presence here just burned out."_ 💥\n\nCross their name off the scroll. The shadows move forward without hesitation.`;

      await conn.sendMessage(jid, { text: goodbyeText, mentions: [targetJid].filter(Boolean) });

    } catch (err) {
      console.error('goodbye command error', err);
      try {
        await conn.sendMessage(message.key.remoteJid, { text: 'Failed to send goodbye message.' });
      } catch (e) { /* ignore */ }
    }
  }
};
