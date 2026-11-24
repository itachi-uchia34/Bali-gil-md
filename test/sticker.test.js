const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const stickerCommand = require('../commands/sticker');

function mockSocket() {
    const sent = [];
    return {
        sent,
        async sendMessage(chatId, payload, options) {
            sent.push({ chatId, payload, options });
        }
    };
}

test('.sticker finds direct images and video media', () => {
    const image = { imageMessage: { mimetype: 'image/jpeg' } };
    const video = { videoMessage: { mimetype: 'video/mp4', seconds: 4 } };
    assert.deepEqual(stickerCommand.findMedia(image), { type: 'image', content: image.imageMessage });
    assert.deepEqual(stickerCommand.findMedia(video), { type: 'video', content: video.videoMessage });
});

test('.sticker finds quoted media inside view-once wrappers', () => {
    const quotedImage = { imageMessage: { mimetype: 'image/png' } };
    const message = {
        extendedTextMessage: {
            contextInfo: {
                quotedMessage: { viewOnceMessage: { message: quotedImage } }
            }
        }
    };
    assert.deepEqual(stickerCommand.findMedia(message), { type: 'image', content: quotedImage.imageMessage });
});

test('.sticker explains missing media and rejects videos longer than ten seconds', async () => {
    const sock = mockSocket();
    await stickerCommand(sock, 'chat', { message: { conversation: '.sticker' } });
    assert.match(sock.sent[0].payload.text, /Send or reply to an image/);

    await stickerCommand(sock, 'chat', { message: { videoMessage: { seconds: 11 } } });
    assert.match(sock.sent[1].payload.text, /limited to 10 seconds/);
    assert.equal(sock.sent.length, 2);
});

test('.sticker converts an image buffer to a valid WebP sticker payload', async () => {
    const input = await sharp({
        create: { width: 16, height: 16, channels: 4, background: { r: 220, g: 30, b: 50, alpha: 1 } }
    }).png().toBuffer();
    const output = await stickerCommand.imageToSticker(input);
    assert.equal(output.subarray(0, 4).toString(), 'RIFF');
    assert.equal(output.subarray(8, 12).toString(), 'WEBP');
    assert.ok(output.length <= stickerCommand.MAX_MEDIA_BYTES);
});
