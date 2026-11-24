const axios = require('axios');
const yts = require('yt-search');
const youtubeScraper = require('@vreden/youtube_scraper');
const { toAudio, tagMp3 } = require('../lib/converter');

const AXIOS_DEFAULTS = {
  timeout: 60000,
  maxContentLength: 15 * 1024 * 1024,
  maxBodyLength: 15 * 1024 * 1024,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*'
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryRequest(getter, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await getter();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(800 * attempt);
    }
  }
  throw lastError;
}

function extractText(message) {
  const content = message?.message?.ephemeralMessage?.message
    || message?.message?.viewOnceMessage?.message
    || message?.message?.viewOnceMessageV2?.message
    || message?.message
    || {};
  return String(
    content.conversation
    || content.extendedTextMessage?.text
    || content.imageMessage?.caption
    || content.videoMessage?.caption
    || ''
  ).trim();
}

function extractQuery(message, requestedQuery = '') {
  const direct = String(requestedQuery || '').trim();
  if (direct) return direct;
  return extractText(message).replace(/^\.(?:song|play|ytmp3)(?:\s+|$)/i, '').trim();
}

function isLikelyAudio(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4096) return false;
  const head = buffer.subarray(0, 16);
  const hasId3 = head.subarray(0, 3).toString('ascii') === 'ID3';
  const hasFrameSync = head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
  const hasOgg = head.subarray(0, 4).toString('ascii') === 'OggS';
  const hasRiff = head.subarray(0, 4).toString('ascii') === 'RIFF';
  const hasMp4 = head.subarray(4, 8).toString('ascii') === 'ftyp';
  return hasId3 || hasFrameSync || hasOgg || hasRiff || hasMp4;
}

function sanitizeTitle(title) {
  const clean = String(title || 'BALI-GIL-MD-AUDIO')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/[^\p{L}\p{N}\s._-]/gu, '')
    .trim()
    .slice(0, 90);
  return clean || 'BALI-GIL-MD-AUDIO';
}

async function getEliteProTechDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
  const response = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  if (response?.data?.success && response.data.downloadURL) {
    return { download: response.data.downloadURL, title: response.data.title };
  }
  throw new Error('EliteProTech returned no audio URL');
}

async function getYupraDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
  const response = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  if (response?.data?.success && response.data?.data?.download_url) {
    return {
      download: response.data.data.download_url,
      title: response.data.data.title,
      thumbnail: response.data.data.thumbnail
    };
  }
  throw new Error('Yupra returned no audio URL');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
  const response = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  if (response?.data?.dl) {
    return { download: response.data.dl, title: response.data.title, thumbnail: response.data.thumb };
  }
  throw new Error('Okatsu returned no audio URL');
}

async function getVredenPackageDownloadByUrl(youtubeUrl) {
  const result = await tryRequest(() => youtubeScraper.ytmp3(youtubeUrl, 128));
  if (result?.status && result?.download?.status && result.download.url) {
    return {
      download: result.download.url,
      title: result.metadata?.title,
      thumbnail: result.metadata?.thumbnail || result.metadata?.image,
      timestamp: result.metadata?.duration?.timestamp
    };
  }
  throw new Error('Vreden downloader returned no audio URL');
}

async function getAlyaDownloadByUrl(youtubeUrl) {
  const apiKey = String(process.env.ALYACHAN_API_KEY || '').trim();
  if (!apiKey) throw new Error('ALYACHAN_API_KEY is not configured');
  const apiUrl = `https://api.alyachan.pro/api/ytmp3?url=${encodeURIComponent(youtubeUrl)}&apikey=${encodeURIComponent(apiKey)}`;
  const response = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  if (response?.data?.status && response.data?.data?.url) {
    return { download: response.data.data.url, title: response.data.data.title };
  }
  throw new Error('Alya returned no audio URL');
}

async function getVredenDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
  const response = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
  if (response?.data?.status && response.data?.result?.download?.url) {
    return {
      download: response.data.result.download.url,
      title: response.data.result.metadata?.title
    };
  }
  throw new Error('Vreden returned no audio URL');
}

async function fetchAudioBuffer(audioUrl) {
  if (!/^https?:\/\//i.test(String(audioUrl || ''))) throw new Error('Provider returned an invalid audio URL');
  const response = await tryRequest(() => axios.get(audioUrl, {
    ...AXIOS_DEFAULTS,
    responseType: 'arraybuffer',
    timeout: 120000,
    headers: { ...AXIOS_DEFAULTS.headers, Accept: 'audio/*,application/octet-stream,*/*' }
  }), 2);
  const buffer = Buffer.from(response.data);
  if (!isLikelyAudio(buffer)) throw new Error('The provider returned an invalid audio file');
  return buffer;
}

async function sendDownloadNotice(sock, chatId, message, video) {
  const caption = `🎵 *DOWNLOADING AUDIO*\n\nTitle: *${video.title || 'Unknown'}*\nDuration: *${video.timestamp || 'N/A'}*\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️`;
  if (!video.thumbnail) return sock.sendMessage(chatId, { text: caption }, { quoted: message });
  try {
    return await sock.sendMessage(chatId, { image: { url: video.thumbnail }, caption }, { quoted: message });
  } catch (_) {
    return sock.sendMessage(chatId, { text: caption }, { quoted: message });
  }
}

async function songCommand(sock, chatId, message, requestedQuery = '') {
  try {
    const query = extractQuery(message, requestedQuery);
    if (!query || /^\.(?:song|play|ytmp3)$/i.test(query)) {
      await sock.sendMessage(chatId, { text: 'Usage: .song <song name or YouTube link>\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️' }, { quoted: message });
      return;
    }

    let video;
    if (/(?:youtube\.com|youtu\.be)/i.test(query)) {
      video = { url: query, title: 'YouTube Audio', thumbnail: null };
    } else {
      const search = await tryRequest(() => yts(query));
      if (!search?.videos?.length) {
        await sock.sendMessage(chatId, { text: '❌ No results found. Try another song name.\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️' }, { quoted: message });
        return;
      }
      video = search.videos[0];
    }

    await sendDownloadNotice(sock, chatId, message, video);

    const providers = [
      ['Vreden package', getVredenPackageDownloadByUrl],
      ['EliteProTech', getEliteProTechDownloadByUrl],
      ['Yupra', getYupraDownloadByUrl],
      ['Okatsu', getOkatsuDownloadByUrl],
      ['Alya', getAlyaDownloadByUrl],
      ['Vreden API', getVredenDownloadByUrl]
    ];

    let audioBuffer;
    let finalTitle = video.title;
    const failures = [];
    for (const [name, provider] of providers) {
      try {
        const audio = await provider(video.url);
        if (!audio?.download) throw new Error('missing audio URL');
        audioBuffer = await fetchAudioBuffer(audio.download);
        finalTitle = audio.title || finalTitle;
        break;
      } catch (error) {
        failures.push(`${name}: ${error.message}`);
        console.warn(`[song] ${name} failed: ${error.message}`);
      }
    }

    if (!audioBuffer) throw new Error('All audio download sources are temporarily unavailable.');

    const header = audioBuffer.subarray(0, 12);
    let extension = 'mp3';
    if (header.subarray(0, 4).toString('ascii') === 'OggS') extension = 'ogg';
    else if (header.subarray(0, 4).toString('ascii') === 'RIFF') extension = 'wav';
    else if (header.subarray(4, 8).toString('ascii') === 'ftyp') extension = 'm4a';

    const convertedBuffer = extension === 'mp3' ? audioBuffer : await toAudio(audioBuffer, extension);
    if (!isLikelyAudio(convertedBuffer)) throw new Error('Audio conversion produced an invalid file.');
    let finalBuffer = convertedBuffer;
    try {
      finalBuffer = await tagMp3(convertedBuffer, {
        title: finalTitle,
        artist: 'BALI GIL MD',
        album: 'BALI GIL MD MUSIC'
      });
    } catch (metadataError) {
      console.warn(`[song] metadata tagging skipped: ${metadataError.message}`);
    }

    await sock.sendMessage(chatId, {
      audio: finalBuffer,
      mimetype: 'audio/mpeg',
      fileName: `${sanitizeTitle(finalTitle)}.mp3`,
      ptt: false
    }, { quoted: message });
  } catch (error) {
    console.error('[song] command error:', error);
    await sock.sendMessage(chatId, {
      text: `❌ ${error.message || 'Unable to download this song right now.'}\n\nPOWERED BY ⚔️ BALI GIL MD ⚔️`
    }, { quoted: message });
  }
}

module.exports = songCommand;
module.exports._test = {
  extractQuery,
  isLikelyAudio,
  sanitizeTitle,
  getVredenPackageDownloadByUrl,
  getAlyaDownloadByUrl,
  youtubeScraper
};
