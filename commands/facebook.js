const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
const { getPublicUrl } = require('../lib/safe_http');

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function isFacebookUrl(value) {
  try {
    const url = new URL(String(value || ''));
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    return ['http:', 'https:'].includes(url.protocol)
      && !url.username && !url.password
      && (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch');
  } catch (_) {
    return false;
  }
}

async function facebookCommand(sock, chatId, message) {
  let tempFile = null;
  try {
    const text = String(message?.message?.conversation || message?.message?.extendedTextMessage?.text || '').trim();
    const url = text.split(/\s+/).slice(1).join(' ').trim();
    if (!url) {
      return await sock.sendMessage(chatId, { text: 'Please provide a Facebook video URL.\nExample: .fb https://www.facebook.com/...' }, { quoted: message });
    }
    if (!isFacebookUrl(url)) {
      return await sock.sendMessage(chatId, { text: 'That is not a valid Facebook or fb.watch URL.' }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });
    const apiUrl = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      timeout: 20000,
      maxContentLength: 2 * 1024 * 1024,
      headers: { accept: 'application/json', 'User-Agent': 'BALI-GIL-MD/2.0.5' }
    });
    const items = response.data?.data?.data;
    if (!Array.isArray(items)) throw new Error('The Facebook download provider returned an invalid response');
    const hdVideo = items.find(item => item?.resolution === 'HD' && item?.format === 'mp4');
    const sdVideo = items.find(item => item?.resolution === 'SD' && item?.format === 'mp4');
    const videoUrl = hdVideo?.url || sdVideo?.url;
    if (!videoUrl) {
      return await sock.sendMessage(chatId, { text: '❌ No downloadable video was returned. The video may be private, deleted, or unavailable.' }, { quoted: message });
    }

    const { response: videoResponse } = await getPublicUrl(videoUrl, {
      responseType: 'stream', timeout: 60000, maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Accept: 'video/mp4,video/*;q=0.9,application/octet-stream;q=0.8,*/*;q=0.1',
        Referer: 'https://www.facebook.com/'
      }
    });
    const contentType = String(videoResponse.headers['content-type'] || '').split(';')[0].toLowerCase();
    const declaredLength = Number(videoResponse.headers['content-length'] || 0);
    if (declaredLength > MAX_VIDEO_BYTES || (contentType && !contentType.startsWith('video/') && contentType !== 'application/octet-stream')) {
      videoResponse.data.destroy();
      throw new Error('The provider returned a non-video or oversized file');
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    tempFile = path.join(tmpDir, `fb_${crypto.randomUUID()}.mp4`);
    let bytes = 0;
    const limit = new Transform({
      transform(chunk, encoding, callback) {
        bytes += chunk.length;
        if (bytes > MAX_VIDEO_BYTES) return callback(new Error('Facebook video exceeds the 100 MB limit'));
        callback(null, chunk);
      }
    });
    await pipeline(videoResponse.data, limit, fs.createWriteStream(tempFile, { flags: 'wx' }));
    if (bytes < 12) throw new Error('The downloaded video is empty or invalid');
    const header = Buffer.alloc(12);
    const fd = fs.openSync(tempFile, 'r');
    try { fs.readSync(fd, header, 0, header.length, 0); } finally { fs.closeSync(fd); }
    if (header.toString('ascii', 4, 8) !== 'ftyp' && !contentType.startsWith('video/')) {
      throw new Error('The downloaded file does not appear to be a video');
    }

    const title = String(response.data?.data?.title || 'Facebook Video').slice(0, 180);
    await sock.sendMessage(chatId, {
      video: { url: tempFile },
      mimetype: contentType.startsWith('video/') ? contentType : 'video/mp4',
      caption: `> *DOWNLOAD BY BALI GIL MD*\n\n📝 Title: ${title}`
    }, { quoted: message });
  } catch (error) {
    console.error('Error in Facebook command:', error.message);
    await sock.sendMessage(chatId, { text: '❌ Facebook download failed. The video may be unavailable, too large, or the provider may be down.' }, { quoted: message });
  } finally {
    if (tempFile) {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); }
      catch (error) { console.error('Error cleaning up Facebook temp file:', error.message); }
    }
  }
}

module.exports = facebookCommand;
module.exports._test = { isFacebookUrl, MAX_VIDEO_BYTES };
