const PUBLIC_INFO_COMMANDS = new Set(['menu']);

function parseCommand(text, prefix = '.') {
    if (typeof text !== 'string' || typeof prefix !== 'string' || prefix.length === 0) return null;
    const normalizedText = text.trimStart();
    if (!normalizedText.startsWith(prefix)) return null;

    const commandText = normalizedText.slice(prefix.length).trim();
    if (!commandText) return null;

    const [rawCommandName, ...args] = commandText.split(/\s+/);
    if (!rawCommandName) return null;

    return {
        commandName: rawCommandName.toLowerCase(),
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
