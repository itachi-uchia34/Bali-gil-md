const settings = require('../settings');

const PUBLIC_INFO_COMMANDS = new Set([
    'menu', 'ownermenu', 'groupmenu', 'downloadmenu', 'aimenu', 'toolmenu', 'funmenu',
    'islamicmenu', 'animemenu', 'logomenu', 'textmenu', 'automenu', 'securitymenu', 'systemmenu',
    'kagemenu', 'bugmenu', 'pluginmenu', 'othermenu'
]);
const COMMAND_ALIASES = new Map([
    ['commands', 'menu'],
    ['command', 'menu'],
    ['cmds', 'menu'],
    ['downloadmen', 'downloadmenu']
]);

function parseCommand(text, prefix = settings.prefix) {
    if (typeof text !== 'string' || typeof prefix !== 'string' || prefix.length === 0) return null;
    const normalizedText = text.trimStart();
    const acceptedPrefixes = prefix === settings.prefix
        ? [...new Set([prefix, ...(Array.isArray(settings.prefixAliases) ? settings.prefixAliases : [])])]
        : [prefix];
    const matchedPrefix = acceptedPrefixes.find(candidate => typeof candidate === 'string' && candidate.length && normalizedText.startsWith(candidate));
    if (!matchedPrefix) return null;

    const commandText = normalizedText.slice(matchedPrefix.length).trim();
    if (!commandText) return null;

    const [rawCommandName, ...args] = commandText.split(/\s+/);
    if (!rawCommandName) return null;
    const normalizedName = rawCommandName.toLowerCase().replace(/[.!?,;:]+$/, '');
    if (!normalizedName) return null;

    return {
        commandName: COMMAND_ALIASES.get(normalizedName) || normalizedName,
        args,
        query: args.join(' ')
    };
}

function isPublicInfoCommand(commandName) {
    return PUBLIC_INFO_COMMANDS.has(String(commandName || '').toLowerCase());
}

function isCommandAllowed(commandName, { isPublic = false, isAuthorized = false } = {}) {
    return Boolean(isPublic || isAuthorized || isPublicInfoCommand(commandName));
}

module.exports = { parseCommand, isPublicInfoCommand, isCommandAllowed };
