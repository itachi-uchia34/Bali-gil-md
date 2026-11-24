const yts = require('yt-search');

function getQuery(message, q = '') {
  const direct = String(q || '').trim();
  if (direct) return direct;
  const content = message?.message?.ephemeralMessage?.message
    || message?.message?.viewOnceMessage?.message
    || message?.message?.viewOnceMessageV2?.message
    || message?.message
    || {};
  const text = String(content.conversation || content.extendedTextMessage?.text || '').trim();
  return text.replace(/^\.thumbnail(?:\s+|$)/i, '').trim();
}

function youtubeId(input) {
  try {
    const url = new URL(input);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0];
    if (url.hostname.includes('youtube.com')) return url.searchParams.get('v') || url.pathname.split('/').pop();
  } catch (_) {}
  return null;
}

async function thumbnail(sock, chatId, message, q = '') {
  const query = getQuery(message, q);
  if (!query) return sock.sendMessage(chatId, { text: 'Usage: .thumbnail <YouTube link or search term>\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️' }, { quoted: message });
  try {
    let video;
    const id = youtubeId(query);
    if (id) video = { videoId: id, title: 'YouTube Thumbnail' };
    else {
      const result = await yts(query);
      if (!result?.videos?.length) throw new Error('No YouTube result found');
      video = result.videos[0];
    }
    const imageUrl = `https://i.ytimg.com/vi/${encodeURIComponent(video.videoId)}/maxresdefault.jpg`;
    return sock.sendMessage(chatId, {
      image: { url: imageUrl },
      caption: `🖼️ *YOUTUBE THUMBNAIL*\n\nTitle: *${video.title || 'YouTube Thumbnail'}*\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️`
    }, { quoted: message });
  } catch (error) {
    return sock.sendMessage(chatId, { text: `❌ Thumbnail download failed: ${error.message}\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️` }, { quoted: message });
  }
}

module.exports = thumbnail;
module.exports._test = { getQuery, youtubeId };
