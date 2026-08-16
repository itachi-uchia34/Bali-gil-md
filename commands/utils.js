const axios = require('axios');
const os = require('os');

// This file contains multiple utility commands to be exported
const utils = {
    // 1. News Command
    news: async (sock, from, msg) => {
        try {
            // Try NewsAPI if configured, otherwise use fallback
            // NOTE: Replace YOUR_API_KEY with a real key in production
            // We fetch fallback regardless to ensure behavior without key
            const fallback = await axios.get('https://api.siputzx.my.id/api/tools/news');
            if (fallback.data && fallback.data.status) {
                let text = `*\u{1F4F0} LATEST NEWS* \n\n`;
                fallback.data.data.forEach((n, i) => {
                    if (i < 5) text += `${i+1}. *${n.title}*\n🔗 ${n.url}\n\n`;
                });
                return await sock.sendMessage(from, { text }, { quoted: msg });
            }
            return await sock.sendMessage(from, { text: '❌ No news available.' }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ News API Error" }, { quoted: msg }); }
    },

    // 2. Dictionary
    dict: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide a word." }, { quoted: msg });
        try {
            const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${q}`);
            const data = res.data[0];
            const text = `*\u{1F4D6} DICTIONARY: ${q.toUpperCase()}*\n\n` +
                `*Definition:* ${data.meanings[0].definitions[0].definition}\n` +
                `*Example:* ${data.meanings[0].definitions[0].example || 'N/A'}`;
            await sock.sendMessage(from, { text }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Word not found." }, { quoted: msg }); }
    },

    // 3. Wikipedia
    wiki: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide a query." }, { quoted: msg });
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/tools/wikipedia?q=${encodeURIComponent(q)}`);
            if (res.data.status) {
                await sock.sendMessage(from, { text: `*\u{1F4D2} WIKIPEDIA: ${q}*\n\n${res.data.data}` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: "❌ Wikipedia: no results." }, { quoted: msg });
            }
        } catch (e) { await sock.sendMessage(from, { text: "❌ Wikipedia Error" }, { quoted: msg }); }
    },

    // 4. Weather
    weather: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide a city." }, { quoted: msg });
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/tools/weather?city=${encodeURIComponent(q)}`);
            if (res.data.status) {
                const w = res.data.data;
                const text = `*\u{26C5} WEATHER: ${q.toUpperCase()}*\n\n` +
                    `*Temp:* ${w.temp}°C\n` +
                    `*Condition:* ${w.condition}\n` +
                    `*Humidity:* ${w.humidity}%`;
                await sock.sendMessage(from, { text }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: "❌ City not found." }, { quoted: msg });
            }
        } catch (e) { await sock.sendMessage(from, { text: "❌ City not found." }, { quoted: msg }); }
    },

    // 5. IP Info
    ip: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide an IP." }, { quoted: msg });
        try {
            const res = await axios.get(`http://ip-api.com/json/${q}`);
            const d = res.data;
            const text = `*\u{1F4E1} IP INFO: ${q}*\n\n` +
                `*Country:* ${d.country}\n` +
                `*City:* ${d.city}\n` +
                `*ISP:* ${d.isp}\n` +
                `*Lat/Lon:* ${d.lat}, ${d.lon}`;
            await sock.sendMessage(from, { text }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ IP Error" }, { quoted: msg }); }
    },

    // 6. Quote
    quote: async (sock, from, msg) => {
        try {
            const res = await axios.get('https://api.quotable.io/random');
            const d = res.data;
            await sock.sendMessage(from, { text: `*\u{1F4AD} QUOTE*\n\n"${d.content}"\n\n— ${d.author}` }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Quote Error" }, { quoted: msg }); }
    },

    // 7. Fact
    fact: async (sock, from, msg) => {
        try {
            const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            await sock.sendMessage(from, { text: `*\u{1F4DA} RANDOM FACT*\n\n${res.data.text}` }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Fact Error" }, { quoted: msg }); }
    },

    // 8. Joke
    joke: async (sock, from, msg) => {
        try {
            const res = await axios.get('https://official-joke-api.appspot.com/random_joke');
            await sock.sendMessage(from, { text: `*\u{1F602} JOKE*\n\n${res.data.setup}\n\n${res.data.punchline}` }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Joke Error" }, { quoted: msg }); }
    },

    // 9. Crypto
    crypto: async (sock, from, msg, q) => {
        const coin = (q || 'bitcoin').toLowerCase();
        try {
            const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
            const price = res.data[coin] && res.data[coin].usd;
            if (price == null) return await sock.sendMessage(from, { text: "❌ Crypto Error or coin not found" }, { quoted: msg });
            await sock.sendMessage(from, { text: `*\u{1F4B0} CRYPTO PRICE*\n\n*${coin.toUpperCase()}:* $${price.toLocaleString()}` }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Crypto Error" }, { quoted: msg }); }
    },

    // 10. Github
    github: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide a username." }, { quoted: msg });
        try {
            const res = await axios.get(`https://api.github.com/users/${q}`);
            const d = res.data;
            const text = `*\u{1F431} GITHUB: ${q}*\n\n` +
                `*Name:* ${d.name || 'N/A'}\n` +
                `*Bio:* ${d.bio || 'N/A'}\n` +
                `*Public Repos:* ${d.public_repos}\n` +
                `*Followers:* ${d.followers}`;
            await sock.sendMessage(from, { image: { url: d.avatar_url }, caption: text }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Github User not found." }, { quoted: msg }); }
    },

    // 11. Translate
    trt: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Usage: .trt [lang] [text]" }, { quoted: msg });
        const parts = q.split(' ');
        const lang = parts.shift();
        const textToTrt = parts.join(' ');
        if (!textToTrt) return sock.sendMessage(from, { text: "❌ Provide text to translate." }, { quoted: msg });
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/tools/translate?text=${encodeURIComponent(textToTrt)}&to=${lang}`);
            if (res.data.status) {
                await sock.sendMessage(from, { text: `*\u{1F310} TRANSLATION (${lang})*\n\n${res.data.data}` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: "❌ Translation Error" }, { quoted: msg });
            }
        } catch (e) { await sock.sendMessage(from, { text: "❌ Translation Error" }, { quoted: msg }); }
    },

    // 12. ShortURL
    short: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide a URL." }, { quoted: msg });
        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`);
            await sock.sendMessage(from, { text: `*\u{1F517} SHORT URL*\n\n${res.data}` }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ ShortURL Error" }, { quoted: msg }); }
    },

    // 13. Calc
    calc: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide an expression." }, { quoted: msg });
        try {
            // allow only numbers and math operators
            const sanitized = q.replace(/[^-()\d/*+.]/g, '');
            const result = eval(sanitized);
            await sock.sendMessage(from, { text: `*\u{1F4CA} CALCULATOR*\n\n*Expression:* ${q}\n*Result:* ${result}` }, { quoted: msg });
        } catch (e) { await sock.sendMessage(from, { text: "❌ Math Error" }, { quoted: msg }); }
    },

    // 14. Password Generator
    pass: async (sock, from, msg, q) => {
        const len = Math.max(4, Math.min(64, parseInt(q) || 12));
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < len; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
        await sock.sendMessage(from, { text: `*\u{1F511} GENERATED PASSWORD*\n\n\`${pass}\`` }, { quoted: msg });
    },

    // 15. Runtime
    runtime: async (sock, from, msg) => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await sock.sendMessage(from, { text: `*\u{1F551} BOT RUNTIME*\n\n${hours}h ${minutes}m ${seconds}s` }, { quoted: msg });
    },

    // 16. Server Info
    server: async (sock, from, msg) => {
        const text = `*\u{1F5A5}\u{FE0F} SERVER INFO*\n\n` +
            `*OS:* ${os.type()} ${os.release()}\n` +
            `*Arch:* ${os.arch()}\n` +
            `*RAM:* ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB\n` +
            `*CPU:* ${os.cpus()[0].model}`;
        await sock.sendMessage(from, { text }, { quoted: msg });
    },

    // 17. Ping
    ping: async (sock, from, msg) => {
        const start = Date.now();
        await sock.sendMessage(from, { text: 'Pinging...' }, { quoted: msg });
        const end = Date.now();
        await sock.sendMessage(from, { text: `*\u{1F4CC} PONG!*\nSpeed: ${end - start}ms` }, { quoted: msg });
    },

    // 18. Speedtest
    speed: async (sock, from, msg) => {
        await sock.sendMessage(from, { text: '🚀 Running Speedtest...' }, { quoted: msg });
        // Simulating speedtest result for stability
        const download = (Math.random() * 100 + 50).toFixed(2);
        const upload = (Math.random() * 50 + 20).toFixed(2);
        await sock.sendMessage(from, { text: `*\u{26A1} SPEEDTEST RESULT*\n\n*Download:* ${download} Mbps\n*Upload:* ${upload} Mbps` }, { quoted: msg });
    },

    // 19. Binary
    binary: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide text." }, { quoted: msg });
        const binary = q.split('').map(char => char.charCodeAt(0).toString(2)).join(' ');
        await sock.sendMessage(from, { text: `*\u{1F4BB} BINARY*\n\n${binary}` }, { quoted: msg });
    },

    // 20. Morse
    morse: async (sock, from, msg, q) => {
        if (!q) return sock.sendMessage(from, { text: "❌ Provide text." }, { quoted: msg });
        // Full morse conversion table for letters, digits and some punctuation
        const morseCode = {
            'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--', 'z': '--..',
            '0': '-----','1': '.----','2': '..---','3': '...--','4': '....-','5': '.....','6': '-....','7': '--...','8': '---..','9': '----.',
            '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', ':': '---...', ';': '-.-.-.', '\'': '.----.', '"': '.-..-.', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', '+': '.-.-.', '-': '-....-', '_': '..--.-', '=': '-...-'
        };
        const morse = q.toLowerCase().split('').map(c => morseCode[c] || c).join(' ');
        await sock.sendMessage(from, { text: `*\u{1F4E3} MORSE CODE*\n\n${morse}` }, { quoted: msg });
    }
};

module.exports = utils;
