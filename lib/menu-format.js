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

module.exports = { formatFramedMenu, sendFramedMenu };
