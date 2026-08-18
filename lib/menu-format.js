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

async function sendFramedMenu(sock, chatId, msg, text, imageUrl) {
    if (imageUrl) {
        try {
            await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: text }, { quoted: msg });
            return { mode: 'image-caption' };
        } catch (error) {
            console.warn('Menu image delivery failed; using text fallback:', error.message || error);
        }
    }
    await sock.sendMessage(chatId, { text }, { quoted: msg });
    return { mode: 'text-fallback' };
}

async function sendMenuWithSong(sock, chatId, msg, text, imageUrl, songUrl) {
    const menuResult = await sendFramedMenu(sock, chatId, msg, text, imageUrl);
    if (!songUrl) return { ...menuResult, song: 'not-configured' };
    try {
        await sock.sendMessage(chatId, {
            audio: { url: songUrl },
            mimetype: 'audio/mpeg',
            fileName: 'bali-gil-md-menu.mp3',
            ptt: false
        }, { quoted: msg });
        return { ...menuResult, song: 'sent' };
    } catch (error) {
        console.warn('Menu song delivery failed:', error.message || error);
        return { ...menuResult, song: 'failed' };
    }
}

module.exports = { formatFramedMenu, sendFramedMenu, sendMenuWithSong };
