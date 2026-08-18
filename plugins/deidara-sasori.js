const themes = {
    deidara: {
        name: 'Deidara',
        title: 'Explosive Artist',
        symbol: '💥',
        quote: 'Art is the flash of a moment that leaves the world changed forever.'
    },
    sasori: {
        name: 'Sasori',
        title: 'Master of Puppets',
        symbol: '🧵',
        quote: 'Control is an art: every thread must move with purpose.'
    }
};

function themedQuote(theme) {
    return `🩸 *━───── 🔴 AKATSUKI ${theme.name.toUpperCase()} 🔴 ─────━* 🩸\n\n` +
        `${theme.symbol} *☠️ ${theme.title.toUpperCase()} ☠️*\n\n` +
        `> _"${theme.quote}"_\n\n` +
        `⚔️ The Shroud remembers every creation and every thread.`;
}

module.exports = {
    name: 'deidara-sasori',
    themes,
    commands: {
        deidaraquote: async (sock, chatId, msg) => {
            await sock.sendMessage(chatId, { text: themedQuote(themes.deidara) }, { quoted: msg });
        },
        sasoriquote: async (sock, chatId, msg) => {
            await sock.sendMessage(chatId, { text: themedQuote(themes.sasori) }, { quoted: msg });
        },
        artquote: async (sock, chatId, msg) => {
            const text = `🩸 *AKATSUKI ARTISTRY* 🩸\n\n` +
                `${themes.deidara.symbol} *Deidara:* ${themes.deidara.quote}\n\n` +
                `${themes.sasori.symbol} *Sasori:* ${themes.sasori.quote}\n\n` +
                `⚔️ Explosive art and puppet control—two disciplines, one Shroud.`;
            await sock.sendMessage(chatId, { text }, { quoted: msg });
        }
    }
};
