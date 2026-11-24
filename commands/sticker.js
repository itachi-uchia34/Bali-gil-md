const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

function unwrapMessage(message) {
    return message?.ephemeralMessage?.message ||
        message?.viewOnceMessage?.message ||
        message?.viewOnceMessageV2?.message ||
        message?.viewOnceMessageV2Extension?.message ||
        message || {};
}

function findMedia(message) {
    const root = unwrapMessage(message);
    const quoted = root.extendedTextMessage?.contextInfo?.quotedMessage;
    const candidates = [root, unwrapMessage(quoted)];
    for (const candidate of candidates) {
        if (candidate?.imageMessage) return { type: 'image', content: candidate.imageMessage };
        if (candidate?.videoMessage) return { type: 'video', content: candidate.videoMessage };
    }
    return null;
}

async function downloadMedia(media) {
    const stream = await downloadContentFromMessage(media.content, media.type);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function imageToSticker(buffer) {
    return sharp(buffer)
        .rotate()
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
}

function videoToSticker(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .inputOptions(['-hide_banner'])
            .outputOptions([
                '-vcodec libwebp',
                '-vf scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0.0',
                '-loop 0',
                '-an',
                '-vsync 0',
                '-t 6',
                '-q:v 55'
            ])
            .format('webp')
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
    });
}

module.exports = async function stickerCommand(sock, chatId, msg) {
    let inputPath;
    try {
        const media = findMedia(msg.message);
        if (!media) {
            return sock.sendMessage(chatId, { text: '⚠️ Send or reply to an image, GIF, or short video with .sticker.' }, { quoted: msg });
        }
        await sock.sendMessage(chatId, { text: '✨ Converting media to sticker...' }, { quoted: msg });
        const input = await downloadMedia(media);
        if (!input.length) throw new Error('The media download was empty.');

        let stickerBuffer;
        if (media.type === 'image') {
            stickerBuffer = await imageToSticker(input);
        } else {
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mardara-sticker-'));
            inputPath = path.join(tempDir, 'input.mp4');
            const outputPath = path.join(tempDir, 'output.webp');
            await fs.writeFile(inputPath, input);
            await videoToSticker(inputPath, outputPath);
            stickerBuffer = await fs.readFile(outputPath);
        }

        if (!stickerBuffer?.length) throw new Error('Sticker conversion produced no output.');
        await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
    } catch (error) {
        await sock.sendMessage(chatId, { text: `❌ Sticker conversion failed: ${error.message}` }, { quoted: msg });
    } finally {
        if (inputPath) await fs.remove(path.dirname(inputPath)).catch(() => {});
    }
};

module.exports.findMedia = findMedia;
module.exports.imageToSticker = imageToSticker;
