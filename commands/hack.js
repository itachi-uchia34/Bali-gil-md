
// commands/hack.js
const settings = require('../settings');
const { normalizeJidUserId } = require('../lib/whatsapp-id');
const { normalizeConfiguredNumbers } = require('../lib/owner-access');

function onlyDigits(s = '') {
  return String(s).replace(/\D/g, '');
}

function getOwnersNormalized() {
  return normalizeConfiguredNumbers(settings.ownerNumber, settings.creatorNumber);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function hackCommand(sock, chatId, message /* original message object */, q) {
  try {
    // Determine sender (works for private & group)
    const rawSender = message.key?.participant || message.key?.remoteJid || '';
    const senderDigits = onlyDigits(normalizeJidUserId(rawSender));

    // Owner(s)
    const owners = getOwnersNormalized();

    // Allow owner or fromMe messages
    if (!owners.includes(senderDigits) && !message.key?.fromMe) {
      return await sock.sendMessage(chatId, { text: '❌ Only the bot owner can use this command.' }, { quoted: message });
    }

    const steps = [
      '💻 *HACK STARTING...* 💻',
      '*Initializing hacking tools...* 🛠️',
      '*Connecting to remote servers...* 🌐',
      '```[█▒▒▒▒] 10%``` ⏳',
      '```[██▒▒▒▒] 30%``` ⏳',
      '```[████▒▒▒] 50%``` ⏳',
      '```[██████▒] 70%``` ⏳',
      '```[████████] 90%``` ⏳',
      '```[████████] 100%``` ✅',
      '🔒 *System Breach: Successful!* 🔓',
      '🚀 *Executing final commands...* 🎯',
      '*📡 Transmitting data...* 📤',
      '_🕵️‍♂️ Covering tracks..._ 🤫',
      '*🔧 Finalizing operations...* 🏁',
      '⚠️ *Note:* This is a joke command for fun.',
      '> *HACK COMPLETE ☣*'
    ];

    for (const line of steps) {
      await sock.sendMessage(chatId, { text: line }, { quoted: message });
      // Random delay between 500ms and 2000ms for realism
      const delay = Math.floor(Math.random() * 1500) + 500;
      await sleep(delay);
    }
  } catch (err) {
    console.error('hackCommand error:', err);
    await sock.sendMessage(chatId, { text: `❌ Error: ${err.message || String(err)}` }, { quoted: message });
  }
}

module.exports = hackCommand;
