const fs = require('fs');
const path = require('path');
const { getMenuCredits } = require('./menu-credits');
const { toSansBold } = require('./menu-text');

function formatFramedMenu({ title, subtitle = 'AKATSUKI SHROUD COMMAND SCROLL', sections = [], footer = [...getMenuCredits(), 'POWERED BY ITACHI-UCHIHA ©'] }) {
    const lines = [
        '╭━━━━━━━━━━━━━━━━━━━━━━╮',
        `┃   🩸 ${toSansBold(title)} 🩸   ┃`,
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        `┃ ${subtitle}`,
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        ''
    ];

    for (const section of sections) {
        const commands = Array.isArray(section.commands) ? section.commands : [];
        lines.push(`┏━━━〔 ${toSansBold(section.title)} 〕━━━┓`);
        for (const command of commands) lines.push(`┃ 🔻 ${command}`);
        lines.push('┗━━━━━━━━━━━━━━━━━━┛', '');
    }

    lines.push('╭━━━━━━━━━━━━━━━━━━━━━━╮');
    const footerLines = Array.isArray(footer) ? footer : [footer];
    for (const line of footerLines) lines.push(`┃  ${line}  ┃`);
    lines.push('╰━━━━━━━━━━━━━━━━━━━━━━╯');
    return lines.join('\n');
}

function mediaCandidates(primary, fallbacks = []) {
    return [...new Set([primary, ...(Array.isArray(fallbacks) ? fallbacks : [])].filter(Boolean))];
}

function splitTextByUtf8Bytes(text, maxBytes = 3500) {
    const source = String(text ?? '');
    if (!source) return [];
    const limit = Number.isSafeInteger(maxBytes) && maxBytes >= 4 ? maxBytes : 3500;
    const chunks = [];
    let chunk = '';
    let chunkBytes = 0;

    const appendCharacters = (value) => {
        for (const character of value) {
            const characterBytes = Buffer.byteLength(character, 'utf8');
            if (chunk && chunkBytes + characterBytes > limit) {
                chunks.push(chunk);
                chunk = '';
                chunkBytes = 0;
            }
            chunk += character;
            chunkBytes += characterBytes;
        }
    };

    for (const line of source.match(/[^\n]*\n|[^\n]+$/g) || []) {
        const lineBytes = Buffer.byteLength(line, 'utf8');
        if (lineBytes > limit) {
            if (chunk) {
                chunks.push(chunk);
                chunk = '';
                chunkBytes = 0;
            }
            appendCharacters(line);
        } else {
            if (chunk && chunkBytes + lineBytes > limit) {
                chunks.push(chunk);
                chunk = '';
                chunkBytes = 0;
            }
            chunk += line;
            chunkBytes += lineBytes;
        }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
}

async function sendMenuText(sock, chatId, msg, text) {
    const chunks = splitTextByUtf8Bytes(text);
    let chunksSent = 0;
    for (const chunk of chunks) {
        try {
            await sock.sendMessage(chatId, { text: chunk }, { quoted: msg });
            chunksSent += 1;
        } catch (firstError) {
            console.warn('Menu text delivery failed:', firstError.message || firstError);
            try {
                await sock.sendMessage(chatId, { text: chunk }, { quoted: msg });
                chunksSent += 1;
            } catch (retryError) {
                console.warn('Menu text retry failed:', retryError.message || retryError);
                return { menu: 'failed', chunksSent, chunksTotal: chunks.length };
            }
        }
    }
    return { menu: chunks.length ? 'sent' : 'failed', chunksSent, chunksTotal: chunks.length };
}

async function sendFramedMenu(sock, chatId, msg, text, imageUrl, imageFallbacks = []) {
    const imageUrls = mediaCandidates(imageUrl, imageFallbacks);
    for (const candidate of imageUrls) {
        try {
            await sock.sendMessage(chatId, { image: { url: candidate }, caption: text }, { quoted: msg });
            return { mode: 'image-caption', imageUrl: candidate };
        } catch (error) {
            console.warn(`Menu image delivery failed for ${candidate}:`, error.message || error);
        }
    }
    await sock.sendMessage(chatId, { text }, { quoted: msg });
    return { mode: 'text-fallback' };
}

async function sendAudioWithFallback(sock, chatId, msg, songUrl, songFallbacks = [], fileName = 'bali-gil-md-menu.mp3') {
    const candidates = mediaCandidates(songUrl, songFallbacks);
    if (!candidates.length) return { song: 'not-configured' };

    for (const candidate of candidates) {
        try {
            if (typeof candidate === 'string' && (candidate.startsWith('/') || candidate.startsWith('./'))) {
                const localPath = path.resolve(candidate);
                if (!fs.existsSync(localPath)) throw new Error(`Audio file not found: ${localPath}`);
                await sock.sendMessage(chatId, {
                    audio: fs.readFileSync(localPath),
                    mimetype: 'audio/mpeg',
                    fileName,
                    ptt: false
                }, { quoted: msg });
                return { song: 'sent', songUrl: candidate, delivery: 'local-buffer' };
            }

            try {
                await sock.sendMessage(chatId, { audio: { url: candidate }, mimetype: 'audio/mpeg', fileName, ptt: false }, { quoted: msg });
                return { song: 'sent', songUrl: candidate, delivery: 'url' };
            } catch (directError) {
                console.warn(`Direct menu song delivery failed for ${candidate}:`, directError.message || directError);
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                try {
                    const response = await fetch(candidate, { signal: controller.signal });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    await sock.sendMessage(chatId, {
                        audio: Buffer.from(await response.arrayBuffer()),
                        mimetype: 'audio/mpeg',
                        fileName,
                        ptt: false
                    }, { quoted: msg });
                    return { song: 'sent', songUrl: candidate, delivery: 'buffer' };
                } finally {
                    clearTimeout(timeout);
                }
            }
        } catch (error) {
            console.warn(`Menu song delivery failed for ${candidate}:`, error.message || error);
        }
    }
    return { song: 'failed' };
}

async function sendMenuWithSong(sock, chatId, msg, text, imageUrl, songUrl, imageFallbacks = [], songFallbacks = []) {
    const { menu: menuStatus } = await sendMenuText(sock, chatId, msg, text);

    let imageResult = { mode: 'text-only' };
    for (const candidate of mediaCandidates(imageUrl, imageFallbacks)) {
        try {
            await sock.sendMessage(chatId, { image: { url: candidate } }, { quoted: msg });
            imageResult = { mode: 'image', imageUrl: candidate };
            break;
        } catch (directError) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            try {
                const response = await fetch(candidate, { signal: controller.signal });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const contentType = response.headers?.get('content-type') || '';
                if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`Unexpected image content type: ${contentType || 'unknown'}`);
                const image = Buffer.from(await response.arrayBuffer());
                if (!image.length || image.length > 8 * 1024 * 1024) throw new Error('Image is empty or exceeds the 8 MB limit');
                await sock.sendMessage(chatId, { image, mimetype: contentType.split(';')[0] }, { quoted: msg });
                imageResult = { mode: 'image-buffer', imageUrl: candidate };
                break;
            } catch (bufferError) {
                console.warn(`Menu cover delivery failed for ${candidate}:`, bufferError.message || directError.message || directError);
            } finally {
                clearTimeout(timeout);
            }
        }
    }

    const songResult = await sendAudioWithFallback(sock, chatId, msg, songUrl, songFallbacks);
    return { ...imageResult, menu: menuStatus, ...songResult };
}

module.exports = { formatFramedMenu, sendFramedMenu, sendMenuWithSong, sendAudioWithFallback, splitTextByUtf8Bytes, sendMenuText };
