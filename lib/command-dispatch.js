const SIMPLE_DISPATCH_COMMANDS = new Set(['ping', 'joke']);

async function invokeCommandHandler(handler, args = []) {
    if (typeof handler !== 'function') return false;
    await handler(...args);
    return true;
}

async function dispatchSimpleCommand(commandName, commands, args = []) {
    if (!SIMPLE_DISPATCH_COMMANDS.has(commandName)) return false;
    return invokeCommandHandler(commands?.[commandName], args);
}

function formatUnknownCommand(prefix, commandName) {
    const activePrefix = typeof prefix === 'string' && prefix.length ? prefix : '.';
    return `Unknown command: ${activePrefix}${commandName}. Use ${activePrefix}menu to see available commands.`;
}

async function sendUnknownCommand(sock, chatId, msg, prefix, commandName) {
    return sock.sendMessage(chatId, {
        text: formatUnknownCommand(prefix, commandName)
    }, { quoted: msg });
}

module.exports = { dispatchSimpleCommand, formatUnknownCommand, sendUnknownCommand };
