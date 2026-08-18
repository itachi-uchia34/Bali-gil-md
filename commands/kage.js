const MODES = {
    hokage: {
        label: 'HOKAGE // WILL OF FIRE',
        icon: '🍃',
        lines: [
            'The Will of Fire stands firm. Protect the squad, then answer with discipline.',
            'A true leader does not need to shout; their actions already command the battlefield.',
            'Your resolve is being tested. Stand up, protect your people, and move forward.'
        ]
    },
    kazekage: {
        label: 'KAZEKAGE // DESERT SHIELD',
        icon: '🏜️',
        lines: [
            'The desert is silent, but its shield is absolute. Your excuse has been sealed in sand.',
            'Patience is your armor. Let the storm pass, then strike with precision.',
            'Even the strongest walls fall when they forget to guard their own foundation.'
        ]
    },
    raikage: {
        label: 'RAIKAGE // LIGHTNING COMMAND',
        icon: '⚡',
        lines: [
            'Lightning Command activated. Less hesitation, more action; the battlefield will not wait.',
            'Your energy is loud, but your execution needs a faster charge.',
            'Move with purpose. Speed without direction is only thunder without a target.'
        ]
    },
    mizukage: {
        label: 'MIZUKAGE // MIST PROTOCOL',
        icon: '🌫️',
        lines: [
            'The Mist has hidden your plan. Reveal your strategy before the fog swallows the mission.',
            'Calm waters conceal sharp currents. Do not mistake silence for weakness.',
            'Your path is unclear, so gather intelligence before making the next move.'
        ]
    },
    tsuchikage: {
        label: 'TSUCHIKAGE // STONE RESOLVE',
        icon: '🪨',
        lines: [
            'Stone Resolve online. Stand your ground, but do not become too heavy to adapt.',
            'Your foundation is strong; now build a better strategy on top of it.',
            'A mountain is moved one stone at a time. Stop rushing and complete the mission.'
        ]
    },
    rivalry: {
        label: 'KAGE VS AKATSUKI // RIVALRY MODE',
        icon: '⚔️',
        lines: [
            'The Kage summit has answered the Akatsuki. Your cloak brings fear, but the villages bring unity.',
            'Akatsuki brings the shadows; the Kage bring the dawn. Choose your side and prove your resolve.',
            'The battlefield is divided: one side controls fear, the other protects the future.'
        ]
    }
};

const ALIASES = {
    '1': 'hokage', 'hokage': 'hokage', 'fire': 'hokage',
    '2': 'kazekage', 'kazekage': 'kazekage', 'sand': 'kazekage',
    '3': 'raikage', 'raikage': 'raikage', 'lightning': 'raikage',
    '4': 'mizukage', 'mizukage': 'mizukage', 'mist': 'mizukage',
    '5': 'tsuchikage', 'tsuchikage': 'tsuchikage', 'stone': 'tsuchikage',
    '6': 'rivalry', 'rivalry': 'rivalry', 'vs': 'rivalry', 'akatsuki': 'rivalry'
};

function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function listText() {
    return [
        '⚔️ *━───── KAGE RIVALRY ─────━* ⚔️',
        '',
        '`.kage` — random village-leader message',
        '`.kage hokage` or `.kage 1` — Will of Fire',
        '`.kage kazekage` or `.kage 2` — Desert Shield',
        '`.kage raikage` or `.kage 3` — Lightning Command',
        '`.kage mizukage` or `.kage 4` — Mist Protocol',
        '`.kage tsuchikage` or `.kage 5` — Stone Resolve',
        '`.kage rivalry` or `.kage 6` — Kage vs Akatsuki',
        '`.kage list` — show all Kage modes',
        '',
        '*POWERED BY ITACHI-UCHIHA ©*'
    ].join('\n');
}

module.exports = async function(sock, from, msg, session, args = []) {
    const input = Array.isArray(args) ? args.map(String) : [];
    const selector = input[0]?.toLowerCase();
    if (selector === 'list' || selector === 'help') {
        return sock.sendMessage(from, { text: listText() }, { quoted: msg });
    }

    const mode = ALIASES[selector] || 'random';
    const selected = mode === 'random' ? pick(Object.keys(MODES)) : mode;
    const profile = MODES[selected];
    const response = [
        `${profile.icon} *━───── ${profile.label} ─────━* ${profile.icon}`,
        '',
        `🗡️ *Mission:* ${pick(['Protect the village', 'Counter the Shroud', 'Secure the summit', 'Train the next squad'])}`,
        `💬 ${pick(profile.lines)}`,
        '',
        '> _"A true leader carries the burden of the village."_',
        '',
        '*BALI GIL MD // KAGE RIVALRY NETWORK*',
        '*POWERED BY ITACHI-UCHIHA ©*'
    ].join('\n');

    await sock.sendMessage(from, { react: { text: selected === 'rivalry' ? '⚔️' : '🛡️', key: msg.key } });
    return sock.sendMessage(from, { text: response }, { quoted: msg });
};
