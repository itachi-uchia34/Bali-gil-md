// commands/welcome.js
// Adds a .welcome command that sends a styled welcome message in groups.
// Baileys-style implementation. Adapt if your bot uses another library.

module.exports = {
  name: 'welcome',
  description: 'Send styled welcome message to a user with group info',
  pattern: /^\.welcome$/i,
  async execute(conn, message) {
    try {
      const jid = message.key.remoteJid;
      if (!jid || !jid.endsWith('@g.us')) {
        return await conn.sendMessage(message.key.remoteJid, { text: 'This command must be used in a group.' });
      }

      // Fetch group metadata (subject, desc, participants)
      let metadata = {};
      try {
        metadata = await conn.groupMetadata(jid);
      } catch (e) {
        // some bot setups use fetchGroupMetadata or similar
        if (conn.fetchGroupMetadata) metadata = await conn.fetchGroupMetadata(jid);
      }

      const groupName = (metadata && metadata.subject) ? metadata.subject : 'this group';
      const desc = (metadata && (metadata.desc || metadata.description)) ? (metadata.desc || metadata.description) : 'No description set.';
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

      const welcomeText = `🩸 *━───── 🔴 AKATSUKI MD 🔴 ─────━* 🩸\n\n*Welcome to the Shroud,* ${mentionText} 👋\n\n You have entered: *@${groupName}*\n 👥 *Ranks Count:* *@${count}* members\n\n📜 *ORGANIZATION LAWS:*\n${desc}\n\n> _\"Those who do not understand true pain can never understand true peace.\"_\n\n⚔️ Put on the cloak, wear your ring, and obey the dynamic. Weakness will not be tolerated.`;

      await conn.sendMessage(jid, { text: welcomeText, mentions: [targetJid].filter(Boolean) });

    } catch (err) {
      console.error('welcome command error', err);
      try {
        await conn.sendMessage(message.key.remoteJid, { text: 'Failed to send welcome message.' });
      } catch (e) { /* ignore */ }
    }
  }
};
