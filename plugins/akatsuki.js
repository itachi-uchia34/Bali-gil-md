const themes = {
    pain: {
        name: 'Pain',
        title: 'The Six Paths of Pain',
        quote: 'Peace is forged by understanding the pain carried by every side.'
    },
    tobi: {
        name: 'Tobi',
        title: 'The Masked Shadow',
        quote: 'A mask can conceal a face, but never the will behind it.'
    },
    itachi: {
        name: 'Itachi Uchiha',
        title: 'The Silent Guardian',
        quote: 'True strength protects others without asking for applause.'
    }
};

function memberMessage(theme) {
    return `🩸 *━───── 🔴 AKATSUKI ${theme.name.toUpperCase()} 🔴 ─────━* 🩸\n\n` +
        `*☠️ ${theme.title.toUpperCase()} ☠️*\n\n` +
        `> _"${theme.quote}"_\n\n` +
        `⚔️ Honor the cloak. Follow the dynamic.`;
}

module.exports = {
    name: 'akatsuki-members',
    themes,
    commands: {
        painquote: async (sock, chatId, msg) => {
            await sock.sendMessage(chatId, { text: memberMessage(themes.pain) }, { quoted: msg });
        },
        tobiquote: async (sock, chatId, msg) => {
            await sock.sendMessage(chatId, { text: memberMessage(themes.tobi) }, { quoted: msg });
        },
        akatsuki: async (sock, chatId, msg) => {
            const roster = Object.values(themes).map((theme) => `🔴 ${theme.name} — ${theme.title}`).join('\n');
            await sock.sendMessage(chatId, {
                text: `🩸 *AKATSUKI MEMBER REGISTRY* 🩸\n\n${roster}\n\nUse ".painquote" or ".tobiquote" to hear the Shroud.`
            }, { quoted: msg });
        }
    }
};
