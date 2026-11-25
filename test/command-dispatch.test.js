const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCommand } = require('../lib/command-parser');
const { dispatchSimpleCommand, sendUnknownCommand } = require('../lib/command-dispatch');
const { dispatchMenuCommand } = require('../lib/menu-dispatch');

async function dispatchParsed(input, prefix, context) {
    const parsed = parseCommand(input, prefix);
    if (!parsed) return { parsed, handled: false };
    let handled = await dispatchMenuCommand(parsed.commandName, context);
    if (!handled) {
        handled = await dispatchSimpleCommand(parsed.commandName, context.commands, [
            context.sock, context.chatId, context.msg
        ]);
    }
    return { parsed, handled };
}

function makeContext(prefix = '.') {
    const calls = [];
    const sock = { sendMessage: async (...args) => calls.push({ type: 'send', args }) };
    const commands = Object.fromEntries(['menu', 'downloadmenu', 'ping', 'joke'].map(name => [
        name,
        async (...args) => calls.push({ type: name, args })
    ]));
    return {
        calls,
        sock,
        chatId: 'chat@s.whatsapp.net',
        msg: { key: { id: 'dispatch-test' } },
        session: {},
        commands,
        botData: {},
        pluginCommandNames: [],
        commandPrefix: prefix
    };
}

test('configured dot prefix routes .ping and .joke to their production handlers', async () => {
    for (const [input, expected] of [['.ping', 'ping'], ['.joke', 'joke']]) {
        const context = makeContext('.');
        const { parsed, handled } = await dispatchParsed(input, '.', context);
        assert.equal(parsed.commandName, expected);
        assert.equal(handled, true);
        assert.equal(context.calls.length, 1);
        assert.equal(context.calls[0].type, expected);
        assert.equal(context.calls[0].args[0], context.sock);
        assert.equal(context.calls[0].args[1], context.chatId);
    }
});

test('configured dot prefix routes .menu and .commands to the real menu dispatch path', async () => {
    for (const input of ['.menu', '.commands']) {
        const context = makeContext('.');
        const { parsed, handled } = await dispatchParsed(input, '.', context);
        assert.equal(parsed.commandName, 'menu');
        assert.equal(handled, true);
        assert.equal(context.calls[0].type, 'menu');
        assert.equal(context.calls[0].args.at(-1), '.');
    }
});

test('default * prefix routes *menu and *ping while ignoring dot-prefixed input', async () => {
    const context = makeContext('*');
    for (const [input, expected] of [['*menu', 'menu'], ['*ping', 'ping']]) {
        const { parsed, handled } = await dispatchParsed(input, '*', context);
        assert.equal(parsed.commandName, expected);
        assert.equal(handled, true);
        assert.equal(context.calls.at(-1).type, expected);
    }
    const oldPrefix = await dispatchParsed('.ping', '*', context);
    assert.equal(oldPrefix.parsed, null);
    assert.equal(oldPrefix.handled, false);
    assert.equal(context.calls.length, 2);
});

test('custom prefix gates commands and is passed through to menu rendering', async () => {
    const context = makeContext('!');
    const { parsed, handled } = await dispatchParsed('!menu', '!', context);
    assert.equal(parsed.commandName, 'menu');
    assert.equal(handled, true);
    assert.equal(context.calls[0].args.at(-1), '!');

    const wrongPrefix = await dispatchParsed('.ping', '!', context);
    assert.equal(wrongPrefix.parsed, null);
    assert.equal(wrongPrefix.handled, false);
    assert.equal(context.calls.length, 1, 'prefix mismatch must not invoke any handler');
});

test('unknown prefixed commands produce the expected in-chat fallback', async () => {
    const context = makeContext('!');
    const parsed = parseCommand('!notarealcommand', '!');
    assert.equal(parsed.commandName, 'notarealcommand');
    await sendUnknownCommand(context.sock, context.chatId, context.msg, '!', parsed.commandName);
    assert.equal(context.calls[0].type, 'send');
    assert.equal(context.calls[0].args[1].text,
        'Unknown command: !notarealcommand. Use !menu to see available commands.');
    assert.equal(context.calls[0].args[2].quoted, context.msg);
});

test('simple dispatcher does not swallow commands outside its explicit set', async () => {
    const context = makeContext();
    assert.equal(await dispatchSimpleCommand('unknown', context.commands, []), false);
    assert.equal(context.calls.length, 0);
});

test('.allmenu is no longer mapped to a menu handler', async () => {
    const context = makeContext('.');
    const parsed = parseCommand('.allmenu', '.');
    assert.equal(parsed.commandName, 'allmenu');
    assert.equal(await dispatchMenuCommand(parsed.commandName, context), false);
    await sendUnknownCommand(context.sock, context.chatId, context.msg, '.', parsed.commandName);
    assert.equal(context.calls[0].type, 'send');
    assert.match(context.calls[0].args[1].text, /Unknown command: \.allmenu/);
});
