function formatFramedMenu({ title, subtitle = 'AKATSUKI SHROUD COMMAND SCROLL', sections = [], footer = 'POWERED BY ITACHI-UCHIHA ©' }) {
    const lines = [
        '╭━━━━━━━━━━━━━━━━━━━━━━╮',
        `┃   🩸 ${title}   ┃`,
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        `┃ ${subtitle}`,
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        ''
    ];

    for (const section of sections) {
        const commands = Array.isArray(section.commands) ? section.commands : [];
        lines.push(`┏━━━〔 ${section.title} 〕━━━┓`);
        for (const command of commands) lines.push(`┃ ◇ ${command}`);
        lines.push('┗━━━━━━━━━━━━━━━━━━┛', '');
    }

    lines.push(
        '╭━━━━━━━━━━━━━━━━━━━━━━╮',
        `┃  ${footer}  ┃`,
        '╰━━━━━━━━━━━━━━━━━━━━━━╯'
    );
    return lines.join('\n');
}

function mediaCandidates(primary, fallbacks = []) {
    return [...new Set([primary, ...(Array.isArray(fallbacks) ? fallbacks : [])].filter(Boolean))];
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

async function sendMenuWithSong(sock, chatId, msg, text, imageUrl, songUrl, imageFallbacks = [], songFallbacks = []) {
    const menuResult = await sendFramedMenu(sock, chatId, msg, text, imageUrl, imageFallbacks);
    const songUrls = mediaCandidates(songUrl, songFallbacks);
    if (!songUrls.length) return { ...menuResult, song: 'not-configured' };
    for (const candidate of songUrls) {
        try {
            await sock.sendMessage(chatId, {
                audio: { url: candidate },
                mimetype: 'audio/mpeg',
                fileName: 'bali-gil-md-menu.mp3',
                ptt: false
            }, { quoted: msg });
            return { ...menuResult, song: 'sent', songUrl: candidate, delivery: 'url' };
        } catch (directError) {
            console.warn(`Direct menu song delivery failed for ${candidate}:`, directError.message || directError);
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                const response = await fetch(candidate, { signal: controller.signal });
                clearTimeout(timeout);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                await sock.sendMessage(chatId, {
                    audio: Buffer.from(await response.arrayBuffer()),
                    mimetype: 'audio/mpeg',
                    fileName: 'bali-gil-md-menu.mp3',
                    ptt: false
                }, { quoted: msg });
                return { ...menuResult, song: 'sent', songUrl: candidate, delivery: 'buffer' };
            } catch (bufferError) {
                console.warn(`Buffered menu song delivery failed for ${candidate}:`, bufferError.message || bufferError);
            }
        }
    }
    return { ...menuResult, song: 'failed' };
}

module.exports = { formatFramedMenu, sendFramedMenu, sendMenuWithSong };
