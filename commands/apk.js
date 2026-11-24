const axios = require('axios');
const { getPublicUrl } = require('../lib/safe_http');

const MAX_APK_BYTES = 75 * 1024 * 1024;
const MAX_ICON_BYTES = 4 * 1024 * 1024;
const ALLOWED_APK_MIME_TYPES = new Set([
  'application/vnd.android.package-archive',
  'application/octet-stream',
  'application/zip',
  'application/x-zip-compressed'
]);

async function apkCommand(sock, chatId, message) {
  try {
    const content = message?.message?.ephemeralMessage?.message
      || message?.message?.viewOnceMessage?.message
      || message?.message;
    const userMessage = String(content?.conversation || content?.extendedTextMessage?.text || '').trim();
    const appName = userMessage.split(/\s+/).slice(1).join(' ');

    if (!appName) {
      await sock.sendMessage(chatId, { text: '⚠️ Please provide an app name. Example: `.apk whatsapp`' }, { quoted: message });
      return;
    }

    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    const apiUrl = 'https://api.nexoracle.com/downloader/apk';
    const params = { apikey: process.env.NEXORACLE_API_KEY || 'free_key@maher_apis', q: appName };
    const response = await axios.get(apiUrl, { params, timeout: 20000, maxContentLength: 1024 * 1024 });
    if (!response.data || response.data.status !== 200 || !response.data.result) {
      await sock.sendMessage(chatId, { text: '❌ Unable to find the APK. Please try again later.' }, { quoted: message });
      return;
    }

    const { name, lastup, package: packageName, size, icon, dllink } = response.data.result;
    let iconBuffer = null;
    if (icon) {
      try {
        const { response: iconResponse } = await getPublicUrl(icon, {
          responseType: 'arraybuffer', timeout: 15000,
          maxContentLength: MAX_ICON_BYTES, maxBodyLength: MAX_ICON_BYTES
        });
        if (String(iconResponse.headers['content-type'] || '').toLowerCase().startsWith('image/')) {
          iconBuffer = Buffer.from(iconResponse.data);
          if (iconBuffer.length > MAX_ICON_BYTES) iconBuffer = null;
        }
      } catch (error) {
        console.warn('[apk] Skipping invalid or unavailable app icon:', error.message);
      }
    }
    if (iconBuffer) {
      await sock.sendMessage(chatId, {
        image: iconBuffer,
        caption: `📦 *Downloading ${String(name || appName).slice(0, 120)}... Please wait.*`
      }, { quoted: message });
    }

    if (typeof dllink !== 'string' || !dllink.trim()) throw new Error('APK download URL is missing');
    const { response: apkResponse } = await getPublicUrl(dllink, {
      responseType: 'arraybuffer', timeout: 60000,
      maxContentLength: MAX_APK_BYTES, maxBodyLength: MAX_APK_BYTES,
      headers: { Accept: 'application/vnd.android.package-archive,application/zip,application/octet-stream' }
    });
    const contentType = String(apkResponse.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const apkBuffer = Buffer.from(apkResponse.data);
    if (!ALLOWED_APK_MIME_TYPES.has(contentType) || apkBuffer.length < 4 || apkBuffer.length > MAX_APK_BYTES || apkBuffer[0] !== 0x50 || apkBuffer[1] !== 0x4b) {
      throw new Error('The download did not return a valid APK archive under the 75 MB limit');
    }

    const safeName = String(name || appName).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 100) || 'application';
    const details = `📦 *APK Details* 📦\n\n🔖 *Name*: ${safeName}\n📅 *Last Update*: ${lastup || 'Unknown'}\n📦 *Package*: ${packageName || 'Unknown'}\n📏 *Size*: ${size || `${(apkBuffer.length / 1024 / 1024).toFixed(1)} MB`}\n\n> © POWERED BY ⚔️ BALI GIL MD ⚔️`;
    await sock.sendMessage(chatId, {
      document: apkBuffer,
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${safeName}.apk`,
      caption: details
    }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
  } catch (error) {
    console.error('❌ Error in apkCommand:', error.message);
    await sock.sendMessage(chatId, { text: '❌ Unable to fetch a safe APK download. Please try again later.' }, { quoted: message });
    await sock.sendMessage(chatId, { react: { text: '❌', key: message?.key } });
  }
}

module.exports = apkCommand;
module.exports._test = { ALLOWED_APK_MIME_TYPES, MAX_APK_BYTES };
