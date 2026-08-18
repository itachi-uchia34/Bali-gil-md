const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

function getQuotedMedia(message) {
    const content = message?.message || {};
    const direct = content.imageMessage || content.videoMessage;
    if (direct) return { media: direct, type: content.imageMessage ? 'image' : 'video' };

    const quoted = content.extendedTextMessage?.contextInfo?.quotedMessage ||
        content.imageMessage?.contextInfo?.quotedMessage ||
        content.videoMessage?.contextInfo?.quotedMessage;
    if (!quoted) return null;

    const media = quoted.imageMessage || quoted.videoMessage;
    return media ? { media, type: quoted.imageMessage ? 'image' : 'video' } : null;
}

async function downloadMedia(media, type) {
    const stream = await downloadContentFromMessage(media, type);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

function convertVideoToSticker(inputBuffer, outputPath) {
    return new Promise((resolve, reject) => {
        const input = new (require('stream').PassThrough)();
        input.end(inputBuffer);
        ffmpeg(input)
            .outputOptions([
                '-vcodec libwebp',
                '-vf scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-loop 0',
                '-an',
                '-t 10',
                '-q:v 70'
            ])
            .format('webp')
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
    });
}

module.exports = async function stickerCommand(sock, chatId, msg) {
    let outputPath;
    try {
        const selected = getQuotedMedia(msg);
        if (!selected) {
            await sock.sendMessage(chatId, { text: '⚠️ Reply to an image or video with `.sticker`.' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(chatId, { text: '✨ Converting to sticker...' }, { quoted: msg });
        const inputBuffer = await downloadMedia(selected.media, selected.type);

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bali-sticker-'));
        outputPath = path.join(tempDir, 'sticker.webp');
        if (selected.type === 'image') {
            await sharp(inputBuffer)
                .rotate()
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 82 })
                .toFile(outputPath);
        } else {
            await convertVideoToSticker(inputBuffer, outputPath);
        }

        const stickerBuffer = await fs.readFile(outputPath);
        if (!stickerBuffer.length) throw new Error('Sticker conversion produced an empty file.');
        await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
    } catch (error) {
        console.error('Sticker command error:', error);
        try {
            await sock.sendMessage(chatId, { text: `❌ Could not create the sticker: ${error.message || 'conversion failed'}` }, { quoted: msg });
        } catch (sendError) {
            console.error('Sticker error message failed:', sendError.message);
        }
    } finally {
        if (outputPath) await fs.remove(path.dirname(outputPath)).catch(() => {});
    }
};
