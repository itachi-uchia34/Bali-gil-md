module.exports = async function helpCommand(sock, chatId, msg, session) {
    const prefix = '.';
    const mode = session?.isPublic ? 'PUBLIC' : 'PRIVATE';
    const text = `🩸 *━───── 🔴 AKATSUKI MD 🔴 ─────━* 🩸

*☠️ SHROUD COMMAND CENTER ☠️*

Welcome, shinobi. Choose an operation below.

*⚔️ GROUP MANAGEMENT*
${prefix}tagall <message> — summon every member
${prefix}kick @member — Pain’s Almighty Push removal
${prefix}ban @member — Pain’s Almighty Push removal
${prefix}promote @member — grant admin rank
${prefix}demote @member — revoke admin rank
${prefix}welcome on/off/status — manage arrivals
${prefix}goodbye on/off/status — manage departures

*🛡️ SECURITY BARRIERS*
${prefix}antilink on — delete links
${prefix}antilink kick — delete links and remove sender
${prefix}antilink off/status — manage barrier
${prefix}autoreact on/off — rotate reactions
${prefix}autoread on/off — manage read status

*🎴 MEDIA & TOOLS*
${prefix}sticker — convert replied media
${prefix}dpz @member — view an Akatsuki profile picture
${prefix}toimg — convert a sticker to image
${prefix}song <query> — download audio
${prefix}video <query> — download video
${prefix}translate <text> <lang> — translate text
${prefix}ai <question> — ask the assistant

*🩸 AKATSUKI MEMBERS*
${prefix}akatsuki — view the member registry
${prefix}painquote — hear Pain’s scroll
${prefix}tobiquote — hear Tobi’s scroll
${prefix}deidaraquote — hear explosive art
${prefix}sasoriquote — hear puppet control
${prefix}artquote — compare both disciplines

*📜 OPERATIONS*
${prefix}menu — open the main menu
${prefix}allmenu — view the full command index
${prefix}status — view bot status
${prefix}ping — check response time

*MODE:* ${mode}
*TIP:* Reply to a member’s message when a command needs a target.

> _"Those who do not understand true pain can never understand true peace."_

⚔️ Wear your ring. Honor the cloak. Follow the dynamic.`;

    await sock.sendMessage(chatId, { text }, { quoted: msg });
};
