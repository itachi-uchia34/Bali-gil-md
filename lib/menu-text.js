const { getMenuCredits } = require('./menu-credits');
const { MENU_CATEGORIES, MENU_SHORTCUTS } = require('./menu-catalogue');

function getCommandNames(commands = {}) {
    return Object.keys(commands).filter((name) => typeof commands[name] === 'function' && commands[name].disabled !== true);
}

function toSansBold(value) {
    return Array.from(String(value), (char) => {
        const code = char.codePointAt(0);
        if (char >= 'A' && char <= 'Z') return String.fromCodePoint(0x1D5D4 + code - 65);
        if (char >= 'a' && char <= 'z') return String.fromCodePoint(0x1D5EE + code - 97);
        if (char >= '0' && char <= '9') return String.fromCodePoint(0x1D7EC + code - 48);
        return char;
    }).join('');
}

function renderSection(title, commands) {
    if (!commands.length) return '';
    const rows = [];
    for (let i = 0; i < commands.length; i += 3) rows.push(commands.slice(i, i + 3).join('  •  '));
    return [`╭─〔 ${toSansBold(title)} 〕`, ...rows.map((row) => `│ ${row}`), '╰' + '━'.repeat(28)].join('\n');
}

function generateMenuText(userName, session, commands = {}, prefix = '.') {
    const safePrefix = typeof prefix === 'string' && prefix.length > 0 ? prefix : '.';
    const mode = session?.isPublic ? 'PUBLIC' : 'PRIVATE';
    const commandNames = getCommandNames(commands);
    const registeredCommands = new Set(commandNames);
    const menuShortcutNames = new Set(MENU_SHORTCUTS.map(([name]) => name));
    const quickAccessNames = new Set(['help', 'h', 'menu']);
    const sections = Object.entries(MENU_CATEGORIES)
        .map(([title, names]) => renderSection(title, [...new Set(names)]
            .filter((name) => registeredCommands.has(name))
            .map((name) => `${safePrefix}${name}`)))
        .filter(Boolean);

    const listedNames = new Set(Object.values(MENU_CATEGORIES).flat());
    const additional = commandNames
        .filter((name) => !listedNames.has(name) && !menuShortcutNames.has(name) && !quickAccessNames.has(name))
        .sort();
    const additionalSection = renderSection('📜 ADDITIONAL REGISTERED COMMANDS', additional.map((name) => `${safePrefix}${name}`));
    if (additionalSection) sections.push(additionalSection);

    const menuShortcuts = MENU_SHORTCUTS
        .filter(([name]) => registeredCommands.has(name))
        .map(([name, label]) => `${safePrefix}${name} • ${label}`);
    const menuSection = renderSection('📚 CATEGORY MENU SHORTCUTS', menuShortcuts);
    if (menuSection) sections.push(menuSection);

    const quickLinks = [...quickAccessNames]
        .filter((name) => registeredCommands.has(name))
        .map((name) => `${safePrefix}${name}`);

    return [
        '╔══════════════════════════════════╗',
        `║ 🩸 ${toSansBold('BALI GIL MD')} • ${toSansBold('FULL COMMAND CATALOGUE')} 🩸 ║`,
        '╚══════════════════════════════════╝',
        `👤 USER: ${userName || 'User'} ┃ MODE: ${mode} ┃ PREFIX: ${safePrefix}`,
        `⚔️ ${toSansBold('STATUS')}: ONLINE ┃ ${toSansBold('RANK')}: ${toSansBold('PAIN’S SIX PATHS')}`,
        '╭──────────────────────────────────╮',
        ...sections.flatMap((section) => [section, '']),
        `╭─〔 ⚡ ${toSansBold('QUICK ACCESS')} 〕`,
        quickLinks.join(' ┃ '),
        '╰──────────────────────────────────╯',
        `🔴 ${toSansBold('ITACHI UCHIHA')} • ${toSansBold('AKATSUKI')}`,
        ...getMenuCredits(),
        'POWERED BY ITACHI-UCHIHA ©'
    ].join('\n');
}

module.exports = { getCommandNames, generateMenuText, toSansBold };
