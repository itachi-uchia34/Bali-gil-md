const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCommand } = require('../lib/command-parser');
const { generateMenuText, getCommandNames } = require('../lib/menu-text');
const helpCommand = require('../commands/help');
const allMenuCommand = require('../commands/allmenu');
const animeCommand = require('../commands/anime');

test('command parser accepts the configured prefix and normalizes the command name only', () => {
    assert.deepEqual(parseCommand('  !MeNu   hello   World  ', '!'), {
        commandName: 'menu',
        args: ['hello', 'World'],
        query: 'hello World'
    });
});

test('command parser ignores messages without the configured prefix or an empty command', () => {
    assert.equal(parseCommand('.menu', '!'), null);
    assert.equal(parseCommand('!   ', '!'), null);
    assert.equal(parseCommand('', '!'), null);
});

test('menu includes callable commands with the configured prefix and excludes internal objects', () => {
    const commands = {
        menu: () => {},
        allmenu: () => {},
        ping: () => {},
        utils: { ping: () => {} },
        missing: null
    };
    const output = generateMenuText('Tester', { isPublic: true }, commands, '!');

    assert.deepEqual(getCommandNames(commands), ['menu', 'allmenu', 'ping']);
    assert.match(output, /PREFIX: !/);
    assert.match(output, /!ping/);
    assert.match(output, /!menu/);
    assert.match(output, /OWNER: BALI GIL/);
    assert.match(output, /OWNER NUMBER: \+?\d+/);
    assert.match(output, /DEVELOPER: ITACHI UCHIHA/);
    assert.doesNotMatch(output, /!utils|!missing/);
});

test('help and allmenu render only usable commands', async () => {
    const commands = {
        help: async () => {},
        menu: async () => {},
        allmenu: async () => {},
        ping: async () => {},
        kage: async () => {},
        utils: { ping: async () => {} }
    };
    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            if (payload.image) throw new Error('Use the text fallback in this test');
            sent.push(payload.text);
        }
    };

    await helpCommand(sock, 'chat', {}, { isPublic: true }, commands);
    await allMenuCommand(sock, 'chat', {}, { isPublic: true }, commands, [], '!');

    assert.match(sent[0], /\.ping/);
    assert.doesNotMatch(sent[0], /\.utils|\.akatsuki|\.painquote/);
    assert.match(sent[1], /!ping/);
    assert.match(sent[1], /!menu/);
    for (const menu of sent) {
        assert.match(menu, /OWNER: BALI GIL/);
        assert.match(menu, /OWNER NUMBER: \+?\d+/);
        assert.match(menu, /DEVELOPER: ITACHI UCHIHA/);
    }
    assert.doesNotMatch(sent[1], /!utils/);
});

test('anime command handles missing query without making a network request', async () => {
    const sent = [];
    const sock = { async sendMessage(_chatId, payload) { sent.push(payload.text); } };

    await animeCommand(sock, 'chat', {}, '');

    assert.match(sent[0], /\.anime <anime name>/);
});
