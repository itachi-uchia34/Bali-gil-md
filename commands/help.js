const { formatFramedMenu } = require('../lib/menu-format');

module.exports = async function helpCommand(sock, chatId, msg, session) {
    const prefix = '.';
    const mode = session?.isPublic ? 'PUBLIC' : 'PRIVATE';
    const command = (name, usage = '') => `${prefix}${name}${usage}`;
    const text = formatFramedMenu({
        title: 'BALI GIL MD HELP',
        subtitle: `AKATSUKI GUIDANCE // MODE: ${mode}`,
        sections: [
            {
                title: '🩸 AKATSUKI GROUP CONTROL',
                commands: [
                    command('tagall', ' <message>'), command('kick', ' @member'), command('ban', ' @member'),
                    command('tobiban', ' @member'), command('promote', ' @member'), command('madarapromote', ' @member'),
                    command('demote', ' @member'), command('welcome', ' on/off/status'), command('goodbye', ' on/off/status'),
                    `${command('mute')} / ${command('gcoff')}`, `${command('unmute')} / ${command('gcon')}`
                ]
            },
            {
                title: '🛡️ PAIN’S SECURITY BARRIERS',
                commands: [
                    command('antilink', ' on'), command('antilink', ' kick'), command('antilink', ' off/status'),
                    command('autoreact', ' on/off'), command('autoread', ' on/off'), command('autochat', ' on/off/status')
                ]
            },
            {
                title: '🎴 SHROUD MEDIA & TOOLS',
                commands: [command('sticker'), command('dpz', ' @member'), command('toimg'), command('song', ' <query>'), command('video', ' <query>'), command('translate', ' <text> <lang>'), command('ai', ' <question>')]
            },
            {
                title: '☁️ AKATSUKI MEMBER SCROLLS',
                commands: [command('akatsuki'), command('painquote'), command('tobiquote'), command('deidaraquote'), command('sasoriquote'), command('artquote')]
            },
            {
                title: '⚔️ QUICK OPERATIONS',
                commands: [command('menu'), command('allmenu'), command('status'), command('ping')]
            }
        ]
    });
    await sock.sendMessage(chatId, { text }, { quoted: msg });
};
