const { formatFramedMenu, sendFramedMenu } = require('../lib/menu-format');
const { getCommandNames } = require('../lib/menu-text');
const settings = require('../settings');

module.exports = async function helpCommand(sock, chatId, msg, session, commands = {}) {
    const prefix = typeof settings.prefix === 'string' && settings.prefix.length ? settings.prefix : '.';
    const mode = session?.isPublic ? 'PUBLIC' : 'PRIVATE';
    const registered = new Set(getCommandNames(commands));
    const command = (name, usage = '') => registered.has(name) ? `${prefix}${name}${usage}` : null;
    const text = formatFramedMenu({
        title: 'BALI GIL MD HELP',
        subtitle: `AKATSUKI GUIDANCE // MODE: ${mode} // PREFIX: ${prefix}`,
        sections: [
            {
                title: '🩸 AKATSUKI GROUP CONTROL',
                commands: [
                    command('tagall', ' <message>'), command('kick', ' @member'), command('ban', ' @member'),
                    command('tobiban', ' @member'), command('promote', ' @member'), command('madarapromote', ' @member'),
                    command('demote', ' @member'), command('welcome', ' on/off/status'), command('goodbye', ' on/off/status'),
                    command('mute'), command('gcoff'), command('unmute'), command('gcon')
                ].filter(Boolean)
            },
            {
                title: '⚔️ KAGE VILLAGE RIVALRY',
                commands: ['kage', 'kagerivalry'].filter((name) => registered.has(name)).map((name) => `${prefix}${name}`)
            },
            {
                title: '🛡️ PAIN’S SECURITY BARRIERS',
                commands: [
                    command('antilink', ' on'), command('antilink', ' kick'), command('antilink', ' off/status'),
                    command('autoreact', ' on/off/status'), command('autoreacts', ' on/off/status'), command('autoread', ' on/off'), command('autochat', ' on/off/status'), command('autoreply', ' on/off/status'), command('keyword', ' on/off/status')
                ].filter(Boolean)
            },
            {
                title: '🎴 SHROUD MEDIA & TOOLS',
                commands: [command('sticker'), command('dpz', ' @member'), command('toimg'), command('song', ' <query>'), command('video', ' <query>'), command('translate', ' <text> <lang>'), command('ai', ' <question>')].filter(Boolean)
            },
            {
                title: '☁️ AKATSUKI MEMBER SCROLLS',
                commands: ['anime', 'manga'].filter((name) => registered.has(name)).map((name) => `${prefix}${name}`)
            },
            {
                title: '⚔️ QUICK OPERATIONS',
                commands: [command('help'), `${prefix}h`, command('menu'), command('allmenu'), command('status'), command('ping')].filter(Boolean)
            }
        ].filter((section) => section.commands.length)
    });
    await sendFramedMenu(sock, chatId, msg, text, settings.startimage, settings.startimageFallbacks);
};
