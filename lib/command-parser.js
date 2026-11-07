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

module.exports = { parseCommand };
