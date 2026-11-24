const settings = require('../settings');
const { formatFramedMenu, sendFramedMenu } = require('./menu-format');
const { getCommandNames, toSansBold } = require('./menu-text');
const { MENU_CATEGORIES, CATEGORY_MENU_CONFIG, MENU_SHORTCUTS } = require('./menu-catalogue');

function createCategoryMenu(config) {
    return async function categoryMenu(sock, chatId, msg, context = {}) {
        const commands = context?.commands && typeof context.commands === 'object' ? context.commands : {};
        const commandPrefix = typeof context?.commandPrefix === 'string' && context.commandPrefix ? context.commandPrefix : (settings.prefix || '.');
        let configuredNames = config.commands || [];
        if (config.dynamic === 'plugins') {
            configuredNames = Array.isArray(context?.pluginCommandNames) ? context.pluginCommandNames : [];
        } else if (config.dynamic === 'other') {
            const categorized = new Set(Object.values(MENU_CATEGORIES).flat());
            const menuCommands = new Set([...MENU_SHORTCUTS.map(([name]) => name), 'menu', 'allmenu', 'help', 'h']);
            const plugins = new Set(Array.isArray(context?.pluginCommandNames) ? context.pluginCommandNames : []);
            configuredNames = getCommandNames(commands).filter((name) => !categorized.has(name) && !menuCommands.has(name) && !plugins.has(name));
        }
        const names = [...new Set(configuredNames.filter((name) => typeof name === 'string'))]
            .filter((name) => typeof commands[name] === 'function');
        const text = formatFramedMenu({
            title: toSansBold(config.title),
            subtitle: `${config.subtitle} • ${names.length} COMMANDS`,
            sections: [{
                title: toSansBold(config.sectionTitle),
                commands: names.length
                    ? names.map((name) => `${commandPrefix}${name}`)
                    : ['No commands in this category are currently registered.']
            }]
        });
        return sendFramedMenu(sock, chatId, msg, text, settings.startimage, settings.startimageFallbacks);
    };
}

module.exports = { MENU_CATEGORIES, CATEGORY_MENU_CONFIG, MENU_SHORTCUTS, createCategoryMenu };
