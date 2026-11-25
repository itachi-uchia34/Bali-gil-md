async function dispatchMenuCommand(commandName, context) {
    const {
        sock,
        chatId,
        msg,
        session,
        commands,
        botData,
        pluginCommandNames = [],
        commandPrefix
    } = context;

    if (commandName === 'menu') {
        await commands.menu(sock, chatId, msg, session, commands, botData, commandPrefix);
        return true;
    }

    if (commandName === 'allmenu') {
        await commands.allmenu(sock, chatId, msg, session, commands, pluginCommandNames, commandPrefix);
        return true;
    }

    if (commandName === 'downloadmenu') {
        await commands.downloadmenu(sock, chatId, msg);
        return true;
    }

    return false;
}

module.exports = { dispatchMenuCommand };
