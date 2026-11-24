const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const MEDIA_TYPES = [
    ['imageMessage', 'image'],
    ['videoMessage', 'video'],
    ['audioMessage', 'audio']
];

const MESSAGE_WRAPPERS = [
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension'
];

function unwrapMessage(message) {
    let current = message || {};

    for (let depth = 0; depth < 8; depth += 1) {
        const wrapper = MESSAGE_WRAPPERS.find(name => current?.[name]?.message);
        if (!wrapper) break;
        current = current[wrapper].message;
    }

    return current || {};
}

function getContextInfo(message) {
    const content = unwrapMessage(message);
    const candidates = [
        content.extendedTextMessage,
        content.imageMessage,
        content.videoMessage,
        content.audioMessage,
        content.documentMessage,
        content.buttonsResponseMessage,
        content.listResponseMessage,
        content.templateButtonReplyMessage
    ];

    return candidates.find(candidate => candidate?.contextInfo)?.contextInfo || null;
}

function getQuotedMessage(msg) {
    const contextInfo = getContextInfo(msg?.message);
    return contextInfo?.quotedMessage ? unwrapMessage(contextInfo.quotedMessage) : null;
}

function findMediaMessage(message) {
    const content = unwrapMessage(message);
    const media = MEDIA_TYPES.find(([key]) => content?.[key]);
    return media ? { key: media[0], type: media[1], message: content[media[0]] } : null;
}

async function sendLoadingReaction(sock, from, msg) {
    try {
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
    } catch (_) {
        // Some WhatsApp clients or restricted chats do not accept reactions.
    }
}

function createVvCommand(commandName = 'vv') {
    return async function viewOnceCommand(sock, from, msg) {
        await sendLoadingReaction(sock, from, msg);

        const quotedMessage = getQuotedMessage(msg);
        if (!quotedMessage) {
            return sock.sendMessage(
                from,
                { text: `❌ Reply to a View-Once image, video, or audio message with .${commandName}.` },
                { quoted: msg }
            );
        }

        const media = findMediaMessage(quotedMessage);
        if (!media) {
            return sock.sendMessage(
                from,
                { text: `❌ The quoted message is not a supported View-Once image, video, or audio message for .${commandName}.` },
                { quoted: msg }
            );
        }

        try {
            const stream = await downloadContentFromMessage(media.message, media.type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            if (!buffer.length) throw new Error('empty media response');

            const caption = `✅ View-Once ${media.type.charAt(0).toUpperCase() + media.type.slice(1)} Downloaded`;
            let payload;

            if (media.type === 'image') {
                payload = { image: buffer, caption };
            } else if (media.type === 'video') {
                payload = {
                    video: buffer,
                    mimetype: media.message.mimetype || 'video/mp4',
                    caption
                };
            } else {
                payload = {
                    audio: buffer,
                    mimetype: media.message.mimetype || 'audio/mp4',
                    fileName: 'view-once-audio.mp4',
                    ptt: false
                };
            }

            await sock.sendMessage(from, payload, { quoted: msg });
            try {
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            } catch (_) {
                // A successful media send should not be reported as a failure if the reaction is rejected.
            }
        } catch (error) {
            console.error(`[${commandName}] View-Once media download failed:`, error.message);
            await sock.sendMessage(
                from,
                { text: `❌ Failed to download the View-Once media with .${commandName}. It may have expired or WhatsApp may have removed its media key.` },
                { quoted: msg }
            );
        }
    };
}

const vvCommand = createVvCommand('vv');
module.exports = vvCommand;
module.exports.createVvCommand = createVvCommand;
module.exports._test = { unwrapMessage, getContextInfo, getQuotedMessage, findMediaMessage };
