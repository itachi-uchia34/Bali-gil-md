const settings = require('../settings');
const { sendOptionalSound } = require('../lib/group-mode-response');

const VERSION_ALIASES = {
    '1': 'pain',
    'pain': 'pain',
    'almighty-push': 'pain',
    '2': 'itachi',
    'itachi': 'itachi',
    'sharingan': 'itachi',
    '3': 'madara',
    'madara': 'madara',
    '4': 'tobi',
    'tobi': 'tobi',
    'obito': 'tobi',
    '5': 'soft',
    'soft': 'soft',
    'friendly': 'soft'
};

const VERSION_LABELS = {
    pain: 'PAIN // ALMIGHTY PUSH',
    itachi: 'ITACHI // SHARINGAN ROAST',
    madara: 'MADARA // WARLORD MODE',
    tobi: 'TOBI // CHAOS MASK',
    soft: 'AKATSUKI // FRIENDLY ROAST'
};

const ROASTS = {
    pain: [
        'Almighty Push! Your confidence has been scattered across six paths, but your logic is still missing.',
        'You speak like a final boss, yet your strategy is still loading. Accept the pain and update your plan.',
        'The Rinnegan has detected a critical weakness: too much noise, not enough impact.'
    ],
    itachi: [
        'Tsukuyomi activated: in your imagination you are unbeatable; in reality, even the crows are confused.',
        'Itachi has reviewed your plan. The verdict is calm: impressive confidence, questionable execution.',
        'Your words have no weight. Even a shadow clone would ask for stronger evidence.'
    ],
    madara: [
        'Madara has entered the battlefield. Your entire argument has been placed under a genjutsu called overconfidence.',
        'You arrived with legendary energy and tutorial-level results. The war is over before your first move.',
        'Perfect Susanoo detected. Unfortunately, it is protecting a very ordinary idea.'
    ],
    tobi: [
        'Tobi report: the mask is mysterious, the plan is dramatic, and the result is still absolutely goofy.',
        'Kamui activated! Your best excuse has disappeared into another dimension.',
        'You tried to create chaos, but even Tobi is asking you to add more creativity.'
    ],
    soft: [
        'Friendly roast from the Shroud: your confidence is premium, but your plan is still on the free trial.',
        'You are not a disaster; you are just an unexpected plot twist with excellent timing.',
        'The Akatsuki council has decided: take a breath, sharpen your strategy, and try that sentence again.'
    ]
};

function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function usage() {
    return [
        '🩸 *━───── GALI VARIANTS ─────━* 🩸',
        '',
        '`.gali @user` — random Akatsuki roast',
        '`.gali pain @user` — Almighty Push mode',
        '`.gali itachi @user` — Sharingan mode',
        '`.gali madara @user` — Warlord mode',
        '`.gali tobi @user` — Chaos Mask mode',
        '`.gali soft @user` — friendly roast',
        '',
        '*POWERED BY ITACHI-UCHIHA ©*'
    ].join('\n');
}

module.exports = async function(sock, from, msg, session, args = []) {
    const input = Array.isArray(args) ? args.map(String) : [];
    const mentioned = msg.mentionedJid?.[0] || msg.quoted?.sender || null;
    let version = 'random';
    let targetArgs = input.slice();

    if (targetArgs[0]?.toLowerCase() === 'list' || targetArgs[0]?.toLowerCase() === 'help') {
        return sock.sendMessage(from, { text: usage() }, { quoted: msg });
    }

    const requestedVersion = VERSION_ALIASES[targetArgs[0]?.toLowerCase()];
    if (requestedVersion) {
        version = requestedVersion;
        targetArgs = targetArgs.slice(1);
    }

    const targetName = targetArgs.join(' ').trim();
    const displayName = targetName || (mentioned ? `@${mentioned.split('@')[0]}` : 'Shroud member');

    if (!mentioned && !targetName) {
        return sock.sendMessage(from, { text: usage() }, { quoted: msg });
    }

    const selectedVersion = version === 'random' ? pick(Object.keys(ROASTS)) : version;
    const heading = VERSION_LABELS[selectedVersion];
    const roast = pick(ROASTS[selectedVersion]);
    const response = [
        `🩸 *━───── ${heading} ─────━* 🩸`,
        '',
        `🎯 *Target:* ${displayName}`,
        `💬 ${roast}`,
        '',
        '> _"Those who do not understand true pain can never understand true peace."_',
        '',
        '*POWERED BY ITACHI-UCHIHA ©*'
    ].join('\n');

    await sock.sendMessage(from, { react: { text: selectedVersion === 'soft' ? '😅' : '🩸', key: msg.key } });
    const sendOptions = { text: response };
    if (mentioned) sendOptions.mentions = [mentioned];
    await sock.sendMessage(from, sendOptions, { quoted: msg });
    await sendOptionalSound(sock, from, msg, settings.galiSound, 'bali-gil-md-gali.mp3', settings.galiSoundFallbacks);
    return;
};
