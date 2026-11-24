const axios = require('axios');

const asma = [
    { no: 1, name: 'Ar-Rahman', meaning: 'The Beneficent' },
    { no: 2, name: 'Ar-Rahim', meaning: 'The Merciful' },
    { no: 3, name: 'Al-Malik', meaning: 'The King' },
    { no: 4, name: 'Al-Quddus', meaning: 'The Holy' },
    { no: 5, name: 'As-Salam', meaning: 'The Peace' },
    { no: 6, name: "Al-Mu'min", meaning: 'The Guardian of Faith' },
    { no: 7, name: 'Al-Muhaymin', meaning: 'The Protector' },
    { no: 8, name: 'Al-Aziz', meaning: 'The Mighty' },
    { no: 9, name: 'Al-Jabbar', meaning: 'The Compeller' },
    { no: 10, name: 'Al-Mutakabbir', meaning: 'The Majestic' }
];

module.exports = async function asmaulhusnaCommand(sock, chatId, msg, q) {
    try {
        const query = String(q || '').trim();
        if (/^\d+$/.test(query)) {
            const num = Number(query);
            if (num >= 1 && num <= 99) {
                const response = await axios.get(`https://api.aladhan.com/v1/asmaAlHusna/${num}`, { timeout: 10000 }).catch(() => null);
                const entries = Array.isArray(response?.data?.data) ? response.data.data : [];
                const entry = entries[0];
                if (entry?.name && entry?.en?.meaning) {
                    const details = [
                        `*✨ Asmaul Husna #${entry.number || num}*`,
                        `Name: *${entry.name}*`,
                        entry.transliteration ? `Transliteration: ${entry.transliteration}` : '',
                        `Meaning: ${entry.en.meaning}`,
                        entry.en.desc ? `\n"${entry.en.desc}"` : ''
                    ].filter(Boolean).join('\n\n');
                    return await sock.sendMessage(chatId, { text: details }, { quoted: msg });
                }
            }
        }

        const text = `*✨ Selected Asmaul Husna*\n\n`
            + asma.map(entry => `${entry.no}. *${entry.name}* - ${entry.meaning}`).join('\n')
            + '\n\n_Use .asmaulhusna <number> for details (1-99)_';
        await sock.sendMessage(chatId, { text }, { quoted: msg });
    } catch (error) {
        await sock.sendMessage(chatId, { text: '❌ Error: ' + error.message }, { quoted: msg });
    }
};
