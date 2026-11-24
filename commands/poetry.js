const SAD_POEMS = [
    'The moon heard every silence I could not explain,\nI smiled through the storm while hiding the rain.\nSome souls leave softly, but their shadows remain.',
    'I built a kingdom from promises and dust,\nThen watched it fall because forever lost its trust.\nNow even my memories walk carefully through the night.',
    'The heart learns the truth long after the eyes see,\nSome goodbyes are chains pretending to be free.\nI release the past, though it still echoes in me.'
];

const ROMANTIC_POEMS = [
    'If the stars are a battlefield, I will stand by your side,\nThrough every endless night and every changing tide.\nYour name is the peace my restless heart cannot hide.',
    'You are the quiet moon above my restless sea,\nThe one rare dream reality allowed to stay with me.\nIn a world of chaos, you feel like destiny.',
    'Let the world chase power and the shadows chase fame,\nI found my greatest victory when I learned your name.\nEven Madara’s storm would bow before this flame.'
];

function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function renderPoem(title, symbol, poem, usage) {
    return `╔══〔 ${symbol} 𝗠𝗔𝗗𝗔𝗥𝗔 ${title} 〕══╗\n\n${poem}\n\n━━━━━━━━━━━━━━━━━━━━\n${usage}\n\n╚════════════════════╝`;
}

async function sadPoetryCommand(sock, from, msg) {
    return sock.sendMessage(from, {
        text: renderPoem('SAD POETRY', '🌑', pick(SAD_POEMS), 'Use `.sadpoetry` or `.sadpoem` for another verse.')
    }, { quoted: msg });
}

async function romanticPoetryCommand(sock, from, msg) {
    return sock.sendMessage(from, {
        text: renderPoem('ROMANTIC POETRY', '❤️', pick(ROMANTIC_POEMS), 'Use `.romanticpoetry` or `.lovepoem` for another verse.')
    }, { quoted: msg });
}

module.exports = { sadPoetryCommand, romanticPoetryCommand };
