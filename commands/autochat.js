async function autochatCommand(sock, chatId, message, isAdmin, session, args, botData, saveBotData) {
  if (!isAdmin) {
    return sock.sendMessage(chatId, {
      text: '❌ Only a group admin or the bot owner can change AutoChat settings.'
    }, { quoted: message });
  }

  const action = String(args?.[0] || 'status').toLowerCase();
  if (!botData.statusSettings) botData.statusSettings = {};
  if (!botData.statusSettings[session.userId]) botData.statusSettings[session.userId] = {};
  const settings = botData.statusSettings[session.userId];
  if (!settings.autoChatChats || typeof settings.autoChatChats !== 'object') settings.autoChatChats = {};

  if (action === 'on' || action === 'enable') {
    if (!String(process.env.OPENAI_API_KEY || '').trim()) {
      return sock.sendMessage(chatId, {
        text: '❌ AutoChat needs an OpenAI API key. Set OPENAI_API_KEY in your deployment secrets, restart the bot, then run .autochat on again.'
      }, { quoted: message });
    }
    settings.autoChatChats[chatId] = true;
    saveBotData();
    return sock.sendMessage(chatId, {
      text: '💬 *AUTOCHAT ENABLED FOR THIS CHAT*\n\nI’ll answer incoming text with a warm, friendly, gently romantic style. Messages in this chat will be sent to OpenAI to generate replies. Use .autochat off to stop.'
    }, { quoted: message });
  }

  if (action === 'off' || action === 'disable') {
    delete settings.autoChatChats[chatId];
    saveBotData();
    return sock.sendMessage(chatId, {
      text: '⏸️ *AUTOCHAT DISABLED FOR THIS CHAT*\n\nAutomatic AI replies have stopped here.'
    }, { quoted: message });
  }

  if (action === 'status') {
    const enabled = settings.autoChatChats[chatId] === true;
    const keyConfigured = Boolean(String(process.env.OPENAI_API_KEY || '').trim());
    return sock.sendMessage(chatId, {
      text: `💬 *AUTOCHAT STATUS*\n\nStatus in this chat: ${enabled ? '✅ ON' : '❌ OFF'}\nOpenAI key: ${keyConfigured ? '✅ configured' : '❌ missing'}\n\nUsage: .autochat on | off | status`
    }, { quoted: message });
  }

  return sock.sendMessage(chatId, {
    text: 'Usage: .autochat on | off | status'
  }, { quoted: message });
}

module.exports = autochatCommand;
