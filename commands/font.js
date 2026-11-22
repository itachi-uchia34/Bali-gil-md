const MAX_INPUT_LENGTH = 100;

function alphabetMap(text, upperStart, lowerStart, digitStart, overrides = {}) {
    return Array.from(text, (char) => {
        if (Object.hasOwn(overrides, char)) return overrides[char];
        const code = char.codePointAt(0);
        if (char >= 'A' && char <= 'Z') return String.fromCodePoint(upperStart + code - 65);
        if (char >= 'a' && char <= 'z') return String.fromCodePoint(lowerStart + code - 97);
        if (digitStart && char >= '0' && char <= '9') return String.fromCodePoint(digitStart + code - 48);
        return char;
    }).join('');
}

function tableMap(text, source, target) {
    const sourceChars = Array.from(source);
    const targetChars = Array.from(target);
    const map = Object.fromEntries(sourceChars.map((char, index) => [char, targetChars[index]]));
    for (const [index, char] of sourceChars.entries()) {
        if (char >= 'A' && char <= 'Z' && !sourceChars.includes(char.toLowerCase())) map[char.toLowerCase()] = targetChars[index];
    }
    return Array.from(text, (char) => map[char] || map[char.toLowerCase()] || char).join('');
}

function combining(text, mark) {
    return Array.from(text, (char) => /\s/.test(char) ? char : `${char}${mark}`).join('');
}

const scriptUpper = '𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵';
const scriptLower = '𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏';
const frakturUpper = '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ';
const frakturLower = '𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷';
const doubleStruckUpper = '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ';
const doubleStruckLower = '𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫';
const circledUpper = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x24B6 + i)).join('');
const circledLower = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x24D0 + i)).join('');
const negativeCircled = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x1F150 + i)).join('');
const squaredUpper = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x1F130 + i)).join('');
const parenthesizedLower = Array.from({ length: 26 }, (_, i) => String.fromCodePoint(0x249C + i)).join('');
const smallCaps = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ';
const superscript = 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ';
const upsideDownUpper = '∀𐐒Ɔ◖ƎℲפHIſ⋊˥WNOԀΌᴚS⊥∩ΛMX⅄Z';
const upsideDownLower = 'ɐqɔpǝɟƃɥᴉɾʞןɯuodbɹsʇnʌʍxʎz';
const greekLookalikes = { A: 'Α', B: 'Β', E: 'Ε', H: 'Η', I: 'Ι', K: 'Κ', M: 'Μ', N: 'Ν', O: 'Ο', P: 'Ρ', T: 'Τ', X: 'Χ', Y: 'Υ', a: 'α', b: 'Ь', c: 'с', e: 'е', i: 'і', j: 'ј', o: 'о', p: 'р', x: 'х', y: 'у' };
const leet = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', b: '8', g: '9' };
const keycaps = { '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣', '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣', '*': '*️⃣', '#': '#️⃣' };
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const styles = [
    ['Bold', (text) => alphabetMap(text, 0x1D400, 0x1D41A, 0x1D7CE)],
    ['Italic', (text) => alphabetMap(text, 0x1D434, 0x1D44E, null, { h: 'ℎ' })],
    ['Bold Italic', (text) => alphabetMap(text, 0x1D468, 0x1D482)],
    ['Script', (text) => tableMap(text, alphabet, scriptUpper + scriptLower)],
    ['Bold Script', (text) => alphabetMap(text, 0x1D4D0, 0x1D4EA)],
    ['Fraktur', (text) => tableMap(text, alphabet, frakturUpper + frakturLower)],
    ['Bold Fraktur', (text) => alphabetMap(text, 0x1D56C, 0x1D586)],
    ['Double-Struck', (text) => tableMap(text, alphabet, doubleStruckUpper + doubleStruckLower)],
    ['Sans Serif', (text) => alphabetMap(text, 0x1D5A0, 0x1D5BA, 0x1D7E2)],
    ['Sans Serif Bold', (text) => alphabetMap(text, 0x1D5D4, 0x1D5EE, 0x1D7EC)],
    ['Sans Serif Italic', (text) => alphabetMap(text, 0x1D608, 0x1D622)],
    ['Sans Serif Bold Italic', (text) => alphabetMap(text, 0x1D63C, 0x1D656)],
    ['Monospace', (text) => alphabetMap(text, 0x1D670, 0x1D68A, 0x1D7F6)],
    ['Circled', (text) => alphabetMap(text, 0x24B6, 0x24D0, null, { '0': '⓪', '1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨' })],
    ['Negative Circled', (text) => tableMap(text, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', negativeCircled)],
    ['Squared', (text) => tableMap(text, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', squaredUpper)],
    ['Parenthesized', (text) => tableMap(text, 'abcdefghijklmnopqrstuvwxyz', parenthesizedLower)],
    ['Fullwidth', (text) => Array.from(text, (c) => c >= '!' && c <= '~' ? String.fromCodePoint(c.charCodeAt(0) + 0xFEE0) : c).join('')],
    ['Small Caps', (text) => tableMap(text, 'abcdefghijklmnopqrstuvwxyz', smallCaps)],
    ['Upside Down', (text) => Array.from(tableMap(text, alphabet, upsideDownUpper + upsideDownLower)).reverse().join('')],
    ['Greek Lookalikes', (text) => Array.from(text, (c) => greekLookalikes[c] || c).join('')],
    ['Leetspeak', (text) => Array.from(text, (c) => leet[c.toLowerCase()] || c).join('')],
    ['Alternating Case', (text) => Array.from(text, (c, i) => /[a-z]/i.test(c) ? (i % 2 ? c.toLowerCase() : c.toUpperCase()) : c).join('')],
    ['Reverse', (text) => Array.from(text).reverse().join('')],
    ['Spaced', (text) => Array.from(text).join(' ')],
    ['Dotted', (text) => combining(text, '\u0307')],
    ['Strikethrough', (text) => combining(text, '\u0336')],
    ['Underline', (text) => combining(text, '\u0332')],
    ['Double Underline', (text) => combining(text, '\u0333')],
    ['Overline', (text) => combining(text, '\u0305')],
    ['Tilde', (text) => combining(text, '\u0303')],
    ['Acute', (text) => combining(text, '\u0301')],
    ['Grave', (text) => combining(text, '\u0300')],
    ['Diaeresis', (text) => combining(text, '\u0308')],
    ['Ring', (text) => combining(text, '\u030A')],
    ['Slash Overlay', (text) => combining(text, '\u0338')],
    ['Bracketed', (text) => Array.from(text, (c) => /\s/.test(c) ? c : `[${c}]`).join('')],
    ['Braced', (text) => Array.from(text, (c) => /\s/.test(c) ? c : `{${c}}`).join('')],
    ['Parentheses', (text) => Array.from(text, (c) => /\s/.test(c) ? c : `(${c})`).join('')],
    ['Quoted', (text) => Array.from(text, (c) => /\s/.test(c) ? c : `“${c}”`).join('')],
    ['Star Separator', (text) => Array.from(text).join('★')],
    ['Heart Separator', (text) => Array.from(text).join('♥')],
    ['Diamond Separator', (text) => Array.from(text).join('◆')],
    ['Dot Separator', (text) => Array.from(text).join('·')],
    ['Dash Separator', (text) => Array.from(text).join('—')],
    ['Slash Separator', (text) => Array.from(text).join('/')],
    ['Wide Separator', (text) => Array.from(text).join('　')],
    ['Regional Letters', (text) => Array.from(text, (c) => /[a-z]/i.test(c) ? String.fromCodePoint(0x1F1E6 + c.toUpperCase().charCodeAt(0) - 65) : c).join('')],
    ['Keycaps', (text) => Array.from(text, (c) => keycaps[c] || c).join('')],
    ['Superscript', (text) => tableMap(text, 'abcdefghijklmnopqrstuvwxyz', superscript)]
];

function getQuotedText(msg) {
    let content = msg?.message || {};
    for (let i = 0; i < 5 && (content.ephemeralMessage?.message || content.viewOnceMessage?.message || content.viewOnceMessageV2?.message); i += 1) {
        content = content.ephemeralMessage?.message || content.viewOnceMessage?.message || content.viewOnceMessageV2?.message;
    }
    const context = content.extendedTextMessage?.contextInfo || content.imageMessage?.contextInfo || content.videoMessage?.contextInfo || content.documentMessage?.contextInfo;
    const quoted = context?.quotedMessage || {};
    return quoted.conversation || quoted.extendedTextMessage?.text || quoted.imageMessage?.caption || quoted.videoMessage?.caption || quoted.documentMessage?.caption || '';
}

function makeFontStyles(text) {
    return styles.map(([name, format], index) => `${String(index + 1).padStart(2, '0')}. ${name}: ${format(text)}`);
}

async function fontCommand(sock, chatId, msg, query = '') {
    const text = String(query || getQuotedText(msg) || '').trim();
    if (!text) {
        return sock.sendMessage(chatId, { text: '🩸 Usage: `.font <text>` or reply to a text message with `.font`.' }, { quoted: msg });
    }
    if (Array.from(text).length > MAX_INPUT_LENGTH) {
        return sock.sendMessage(chatId, { text: `⚠️ Keep the text to ${MAX_INPUT_LENGTH} characters or fewer so all 50 styles fit in one WhatsApp message.` }, { quoted: msg });
    }
    const output = ['*🩸 AKATSUKI • 50 FONT STYLES 🩸*', ...makeFontStyles(text).map((line) => `🔻 ${line}`)].join('\n');
    return sock.sendMessage(chatId, { text: output }, { quoted: msg });
}

module.exports = fontCommand;
module.exports.styles = styles;
module.exports.makeFontStyles = makeFontStyles;
module.exports.getQuotedText = getQuotedText;
module.exports.MAX_INPUT_LENGTH = MAX_INPUT_LENGTH;
