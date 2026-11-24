const path = require('path');
const { getPublicUrl, isBlockedHostname } = require('../lib/safe_http');

const MAX_BYTES = 25 * 1024 * 1024;
const USER_AGENT = 'BALI-GIL-MD/2.0.5';

function getQuery(message, q = '') {
  const direct = String(q || '').trim();
  if (direct) return direct;
  const content = message?.message?.ephemeralMessage?.message
    || message?.message?.viewOnceMessage?.message
    || message?.message?.viewOnceMessageV2?.message
    || message?.message;
  if (!content) return '';
  const text = String(content.conversation || content.extendedTextMessage?.text || '').trim();
  return text.replace(/^\.(?:directdl|urldl|download|customdl|audiourl|videourl|imagedl|docdl)(?:\s+|$)/i, '').trim();
}

function filenameFromResponse(response, url) {
  const disposition = String(response.headers['content-disposition'] || '');
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  let filename = match?.[1] ? decodeURIComponent(match[1]) : path.basename(new URL(url).pathname);
  filename = String(filename || 'BALI GIL-DOWNLOAD').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim();
  return (filename || 'BALI GIL-DOWNLOAD').slice(0, 100);
}

function classify(mimetype, filename) {
  const mime = String(mimetype || '').toLowerCase().split(';')[0];
  const ext = path.extname(filename).toLowerCase();
  if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return 'image';
  if (mime.startsWith('video/') || ['.mp4', '.mkv', '.webm', '.mov'].includes(ext)) return 'video';
  if (mime.startsWith('audio/') || ['.mp3', '.m4a', '.ogg', '.wav', '.flac'].includes(ext)) return 'audio';
  return 'document';
}

async function directDownload(sock, chatId, message, q = '') {
  const input = getQuery(message, q);
  if (!input) {
    return sock.sendMessage(chatId, { text: 'Usage: .directdl <public file URL>\nAliases: .urldl, .download\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️' }, { quoted: message });
  }

  let parsed;
  try {
    parsed = new URL(input);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || isBlockedHostname(parsed.hostname)) {
      throw new Error('blocked URL');
    }
  } catch (_) {
    return sock.sendMessage(chatId, { text: '❌ Provide a valid public HTTP or HTTPS file URL. Private and local addresses are blocked.\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️' }, { quoted: message });
  }

  try {
    const { response, url } = await getPublicUrl(parsed.href, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: MAX_BYTES,
      maxBodyLength: MAX_BYTES,
      maxRedirects: 5,
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*' }
    });
    const buffer = Buffer.from(response.data);
    if (!buffer.length || buffer.length > MAX_BYTES) throw new Error('file is empty or larger than 25 MB');
    const filename = filenameFromResponse(response, url);
    const mimetype = String(response.headers['content-type'] || 'application/octet-stream').split(';')[0];
    const kind = classify(mimetype, filename);
    const caption = `📥 *DIRECT DOWNLOAD COMPLETE*\n\nFile: *${filename}*\nSize: *${(buffer.length / 1024 / 1024).toFixed(2)} MB*\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️`;
    const payload = kind === 'image'
      ? { image: buffer, caption }
      : kind === 'video'
        ? { video: buffer, mimetype, caption }
        : kind === 'audio'
          ? { audio: buffer, mimetype, fileName: filename, ptt: false }
          : { document: buffer, mimetype, fileName: filename, caption };
    return sock.sendMessage(chatId, payload, { quoted: message });
  } catch (error) {
    console.error('[directdl] error:', error.message);
    return sock.sendMessage(chatId, { text: `❌ Download failed: ${error.message}\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️` }, { quoted: message });
  }
}

module.exports = directDownload;
module.exports._test = { classify, isBlockedHost: isBlockedHostname, filenameFromResponse };
