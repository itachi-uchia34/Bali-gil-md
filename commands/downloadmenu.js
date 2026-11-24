const settings = require('../settings');

const DOWNLOAD_COMMANDS = [
  ['.song <name/link>', 'download audio as MP3'],
  ['.play <name/link>', 'search and download music as MP3'],
  ['.ytmp3 <name/link>', 'YouTube audio shortcut'],
  ['.ytmp4 <name/link>', 'YouTube video shortcut'],
  ['.video <name/link>', 'download video'],
  ['.youtube <link>', 'download YouTube media'],
  ['.spotify <name/link>', 'download Spotify audio'],
  ['.spdl <name/link>', 'Spotify shortcut'],
  ['.tiktok <link>', 'download TikTok media'],
  ['.ttdl <link>', 'TikTok shortcut'],
  ['.insta <link>', 'download Instagram media'],
  ['.igdl <link>', 'Instagram shortcut'],
  ['.facebook <link>', 'download Facebook media'],
  ['.fbdown <link>', 'Facebook shortcut'],
  ['.pinterest <query>', 'search Pinterest images'],
  ['.pindl <query>', 'Pinterest shortcut'],
  ['.twitter <link>', 'download X/Twitter media'],
  ['.twtdl <link>', 'X/Twitter shortcut'],
  ['.reddit <link>', 'download Reddit media'],
  ['.reddown <link>', 'Reddit shortcut'],
  ['.gdrive <link>', 'download Google Drive files'],
  ['.mf <link>', 'download MediaFire files'],
  ['.apk <query>', 'search APK files'],
  ['.directdl <public-url>', 'download a direct media URL'],
  ['.urldl <public-url>', 'direct URL shortcut'],
  ['.download <public-url>', 'direct URL shortcut'],
  ['.customdl <public-url>', 'custom direct downloader'],
  ['.audiourl <public-url>', 'download public audio'],
  ['.videourl <public-url>', 'download public video'],
  ['.imagedl <public-url>', 'download public image'],
  ['.docdl <public-url>', 'download public document'],
  ['.thumbnail <YouTube link>', 'download YouTube thumbnail']
];

const DOWNLOAD_EMOJIS = {
  '.song <name/link>': '🎧', '.play <name/link>': '🎶', '.ytmp3 <name/link>': '🎵',
  '.ytmp4 <name/link>': '🎬', '.video <name/link>': '🎥', '.youtube <link>': '▶️',
  '.spotify <name/link>': '🎧', '.spdl <name/link>': '🎵', '.tiktok <link>': '📱',
  '.ttdl <link>': '⬇️', '.insta <link>': '📸', '.igdl <link>': '🖼️',
  '.facebook <link>': '📘', '.fbdown <link>': '⬇️', '.pinterest <query>': '📌',
  '.pindl <query>': '⬇️', '.twitter <link>': '🐦', '.twtdl <link>': '⬇️',
  '.reddit <link>': '👽', '.reddown <link>': '⬇️', '.gdrive <link>': '☁️',
  '.mf <link>': '📁', '.apk <query>': '📦', '.directdl <public-url>': '🔗',
  '.urldl <public-url>': '🌐', '.download <public-url>': '⬇️',
  '.customdl <public-url>': '🧰', '.audiourl <public-url>': '🎧',
  '.videourl <public-url>': '🎥', '.imagedl <public-url>': '🖼️',
  '.docdl <public-url>': '📄', '.thumbnail <YouTube link>': '🖼️'
};

async function downloadMenu(sock, chatId, message) {
  const lines = [
    '╭━━━〔 📥 *BALI GIL DOWNLOAD ARSENAL* 〕━━━╮',
    '┃ 🎧 Audio  ·  🎬 Video  ·  📁 Files',
    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
    '',
    ...DOWNLOAD_COMMANDS.map(([command]) => `┃ ${DOWNLOAD_EMOJIS[command] || '🔹'} ${command}`),
    '',
    `⚔️ POWERED BY ${settings.poweredBy}`
  ];
  return sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
}

module.exports = downloadMenu;
module.exports.DOWNLOAD_COMMANDS = DOWNLOAD_COMMANDS;
module.exports.DOWNLOAD_EMOJIS = DOWNLOAD_EMOJIS;
