const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCommand } = require('../lib/command-parser');
const { dispatchMenuCommand } = require('../lib/menu-dispatch');

function createContext(commandPrefix) {
    const calls = [];
    const sock = {};
    const msg = { key: { id: 'menu-dispatch-test' } };
    const session = { userId: 'test-account' };
    const botData = { statusSettings: {} };
    const commands = {
        menu: async (...args) => calls.push({ name: 'menu', args }),
        downloadmenu: async (...args) => calls.push({ name: 'downloadmenu', args })
    };
    return {
        calls,
        commandPrefix,
        dispatch: (commandName) => dispatchMenuCommand(commandName, {
            sock, chatId: 'chat@s.whatsapp.net', msg, session, commands, botData,
            commandPrefix
        })
    };
}

test('the production menu dispatcher routes .menu and .commands to the full menu handler', async () => {
    for (const input of ['.menu', '.commands']) {
        const parsed = parseCommand(input, '.');
        const context = createContext('.');
        assert.equal(parsed.commandName, 'menu');
        assert.equal(await context.dispatch(parsed.commandName), true);
        assert.equal(context.calls.length, 1);
        assert.equal(context.calls[0].name, 'menu');
        assert.equal(context.calls[0].args[6], '.');
    }
});

test('the production menu dispatcher routes .downloadmenu and its legacy short spelling', async () => {
    for (const input of ['.downloadmenu', '.downloadmen']) {
        const parsed = parseCommand(input, '.');
        const context = createContext('.');
        assert.equal(parsed.commandName, 'downloadmenu');
        assert.equal(await context.dispatch(parsed.commandName), true);
        assert.equal(context.calls.length, 1);
        assert.equal(context.calls[0].name, 'downloadmenu');
    }
});

test('configured non-dot prefix is parsed and passed through to the same menu handler', async () => {
    const parsed = parseCommand('  !commands', '!');
    const context = createContext('!');
    assert.equal(parsed.commandName, 'menu');
    assert.equal(await context.dispatch(parsed.commandName), true);
    assert.equal(context.calls[0].args[6], '!');
    assert.equal(parseCommand('.commands', '!'), null, 'a different active prefix is not silently accepted');
});

test('unknown names are not swallowed by the menu dispatcher', async () => {
    const context = createContext('.');
    assert.equal(await context.dispatch('allmenu'), false);
    assert.equal(await context.dispatch('not-a-menu'), false);
    assert.equal(context.calls.length, 0);
});
