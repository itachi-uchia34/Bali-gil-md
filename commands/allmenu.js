const { formatFramedMenu, sendFramedMenu } = require('../lib/menu-format');
const { getCommandNames, toSansBold } = require('../lib/menu-text');
const { MENU_SHORTCUTS } = require('../lib/menu-categories');
const settings = require('../settings');

async function allMenu(sock, from, msg, session, commands = {}, pluginCommandNames = [], commandPrefix = settings.prefix) {
    const registered = new Set(getCommandNames(commands));
    const pluginNames = Array.isArray(pluginCommandNames)
        ? [...new Set(pluginCommandNames.filter((name) => typeof name === 'string' && name.trim()))]
            .filter((name) => registered.has(name))
        : [];
    const prefix = typeof commandPrefix === 'string' && commandPrefix.length ? commandPrefix : '.';
    const availableMenus = MENU_SHORTCUTS
        .filter(([name]) => registered.has(name) && (name !== 'pluginmenu' || pluginNames.length > 0))
        .map(([name, label]) => `${prefix}${name} • ${label}`);
    const quickAccess = ['menu', 'help'].filter((name) => registered.has(name)).map((name) => `${prefix}${name}`);
    const sections = [];

    if (availableMenus.length) {
        sections.push({ title: '📚 CATEGORY MENUS', commands: availableMenus });
    }
    if (quickAccess.length) {
        sections.push({ title: '⚡ COMPLETE COMMAND LIST', commands: quickAccess });
    }

    const allMenuText = formatFramedMenu({
        title: toSansBold('BALI GIL MD MENU DIRECTORY'),
        subtitle: `${toSansBold('CHOOSE A CATEGORY MENU')} • ${toSansBold(`${availableMenus.length} MENUS AVAILABLE`)}`,
        sections
    });
    await sendFramedMenu(sock, from, msg, allMenuText, settings.startimage, settings.startimageFallbacks);
}

module.exports = allMenu;
