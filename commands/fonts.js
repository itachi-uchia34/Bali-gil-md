const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

const maps = {
    bold: ['𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇', '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭', '𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵'],
    italic: ['𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻', '𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡', DIGITS],
    boldItalic: ['𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯', '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉', DIGITS],
    script: ['𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏', '𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵', DIGITS],
    boldScript: ['𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃', '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩', DIGITS],
    fraktur: ['𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷', '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ', DIGITS],
    double: ['𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫', '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ', '𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡'],
    sans: ['𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓', '𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹', DIGITS],
    sansBold: ['𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇', '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭', '𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵'],
    monospace: ['𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣', '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉', '𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿']
};

function translate(text, map) {
    const tables = [new Map([...LOWER].map((c, i) => [c, [...map[0]][i]])), new Map([...UPPER].map((c, i) => [c, [...map[1]][i]])), new Map([...DIGITS].map((c, i) => [c, [...map[2]][i]]))];
    return [...text].map(char => tables.reduce((result, table) => table.get(result) || result, char)).join('');
}

const styles = [
    text => translate(text, maps.bold), text => translate(text, maps.italic), text => translate(text, maps.boldItalic),
    text => translate(text, maps.script), text => translate(text, maps.boldScript), text => translate(text, maps.fraktur),
    text => translate(text, maps.double), text => translate(text, maps.sans), text => translate(text, maps.sansBold),
    text => translate(text, maps.monospace), text => `『 ${text} 』`, text => `【 ${text} 】`,
    text => `《 ${text} 》`, text => `〈 ${text} 〉`, text => `「 ${text} 」`, text => `『 ${text} 』`,
    text => `╰┈➤ ${text}`, text => `➤ ${text} ◀`, text => `✦ ${text} ✦`, text => `✧･ﾟ: *✧ ${text} ✧*:･ﾟ✧`,
    text => `༺ ${text} ༻`, text => `꧁ ${text} ꧂`, text => `【﻿${text}】`, text => `░▒▓█ ${text} █▓▒░`,
    text => `▓▒░ ${text} ░▒▓`, text => `◥ ${text} ◤`, text => `◈ ${text} ◈`, text => `◆ ${text} ◆`,
    text => `● ${text} ●`, text => `○ ${text} ○`, text => `★ ${text} ★`, text => `☆ ${text} ☆`,
    text => `♥ ${text} ♥`, text => `♡ ${text} ♡`, text => `☠ ${text} ☠`, text => `☾ ${text} ☽`,
    text => `☼ ${text} ☼`, text => `⚡ ${text} ⚡`, text => `☯ ${text} ☯`, text => `♛ ${text} ♛`,
    text => `♕ ${text} ♕`, text => `♚ ${text} ♚`, text => `♞ ${text} ♞`, text => `♜ ${text} ♜`,
    text => `｡ﾟ•┈୨ ${text} ୧┈•ﾟ｡`, text => `*ੈ✩‧₊˚ ${text} ˚₊‧✩ੈ*`, text => `•°¯\`•• ${text} ••´¯°•`,
    text => [...text].reverse().join(''), text => [...text].map(c => c === ' ' ? ' ' : c + '\u0336').join(''),
    text => [...text].map(c => c === ' ' ? ' ' : c + '\u0332').join(''), text => [...text].map(c => c === ' ' ? ' ' : c + '\u0305').join('')
];

function makeFontCommand(index) {
    return async function fontCommand(sock, chatId, msg, q) {
        const input = (q || '').trim();
        if (!input) {
            return sock.sendMessage(chatId, { text: `Usage: .font${index} your text` }, { quoted: msg });
        }
        const output = styles[index - 1](input);
        await sock.sendMessage(chatId, { text: `*Font ${index}:*\n${output}` }, { quoted: msg });
    };
}

const fonts = {
    fonts: async (sock, chatId, msg) => {
        const commands = Array.from({ length: 50 }, (_, i) => `.font${i + 1}`).join('  ');
        await sock.sendMessage(chatId, { text: `*50 FONT COMMANDS*\n\n${commands}\n\nExample: .font1 BALI GIL MD` }, { quoted: msg });
    }
};
for (let index = 1; index <= 50; index += 1) fonts[`font${index}`] = makeFontCommand(index);

module.exports = fonts;
