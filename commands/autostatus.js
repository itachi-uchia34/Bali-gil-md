const fs = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function unwrapContent(message) {
    let content = message || {};
    while (content?.ephemeralMessage?.message || content?.viewOnceMessage?.message || content?.viewOnceMessageV2?.message || content?.documentWithCaptionMessage?.message) {
        content = content.ephemeralMessage?.message || content.viewOnceMessage?.message || content.viewOnceMessageV2?.message || content.documentWithCaptionMessage?.message;
    }
    return content;
}

/**
 * Handle status updates (Auto Seen, Auto Like, Auto Download)
 * @param {import('@whiskeysockets/baileys').WASocket} sock 
 * @param {any} m 
 * @param {any} botData 
 * @param {string} userId 
 */
async function handleStatusUpdate(sock, m, botData, userId) {
    try {
        const settings = botData.statusSettings[userId];
        if (!settings || !settings.autoStatus) return;

        const messages = Array.isArray(m?.messages) ? m.messages : [m];
        const msg = messages.find((entry) => entry?.key?.remoteJid === 'status@broadcast');
        if (!msg) return;

        const from = msg.key.participant || msg.key.remoteJid;

        // Auto Seen
        if (settings.autoSeen) {
            await sock.readMessages([msg.key]);
        }

        // Auto Like (React)
        if (settings.autoLike) {
            const emojis = ['❤️', '👍', '🔥', '👏', '😮', '😂', '🙌', '✨', '⭐', '✅'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            await sock.sendMessage('status@broadcast', {
                react: { text: randomEmoji, key: msg.key }
            }, { statusJidList: [from] });
        }

        // Auto Download
        if (settings.autoDownload) {
            const content = unwrapContent(msg.message);
            const mediaKey = ['imageMessage', 'videoMessage', 'audioMessage'].find((key) => content?.[key]);
            if (mediaKey) {
                const mediaType = mediaKey.replace('Message', '');
                const media = content[mediaKey];
                const stream = await downloadContentFromMessage(media, mediaType);
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                const buffer = Buffer.concat(chunks);
                if (buffer.length) {
                    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
                    const outputDir = path.join(__dirname, '..', 'data', 'status-downloads', safeUserId);
                    const mimeSubtype = String(media.mimetype || '').split('/')[1]?.split(';')[0];
                    const extension = mimeSubtype === 'jpeg' ? 'jpg' : (mimeSubtype || (mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'ogg')).replace(/[^a-zA-Z0-9]/g, '');
                    const messageId = String(msg.key.id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
                    await fs.ensureDir(outputDir);
                    await fs.writeFile(path.join(outputDir, `${messageId}.${extension}`), buffer);
                }
            }
        }
    } catch (e) {
        console.error("Error in handleStatusUpdate:", e);
    }
}

module.exports = { handleStatusUpdate };
