const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCommand, isPublicInfoCommand, isCommandAllowed } = require('../lib/command-parser');
const { generateMenuText, getCommandNames } = require('../lib/menu-text');
const helpCommand = require('../commands/help');
const allMenuCommand = require('../commands/allmenu');
const animeCommand = require('../commands/anime');
const { sendMenuWithSong } = require('../lib/menu-format');
const autoreactsCommand = require('../commands/autoreacts');
const { AUTO_REACT_EMOJIS, getAutoReactEmojiList, nextAutoReactEmoji } = require('../lib/auto-react');
const { normalizeJidUserId } = require('../lib/whatsapp-id');

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

test('menu is allowed for ordinary users in private mode without opening other commands', () => {
    assert.equal(isPublicInfoCommand('menu'), true);
    assert.equal(isPublicInfoCommand('MENU'), true);
    assert.equal(isPublicInfoCommand('ping'), false);
    assert.equal(isCommandAllowed('menu', { isPublic: false, isAuthorized: false }), true);
    assert.equal(isCommandAllowed('ping', { isPublic: false, isAuthorized: false }), false);
    assert.equal(isCommandAllowed('ping', { isPublic: true, isAuthorized: false }), true);
});

test('autoreact rotates through every emoji and then starts over', () => {
    const session = { autoReactIndex: 0 };
    const firstCycle = AUTO_REACT_EMOJIS.map(() => nextAutoReactEmoji(session));

    assert.deepEqual(firstCycle, AUTO_REACT_EMOJIS);
    assert.equal(session.autoReactIndex, 0);
    assert.equal(nextAutoReactEmoji(session), AUTO_REACT_EMOJIS[0]);
});

test('autoreact command enables, persists, disables, and displays all available emojis', async () => {
    const sent = [];
    const sock = { async sendMessage(_chatId, payload) { sent.push(payload); } };
    const session = { userId: 'bot-123', autoReact: false };
    const botData = {};
    let saveCount = 0;

    await autoreactsCommand(sock, 'chat', {}, true, session, ['on'], botData, () => { saveCount += 1; });
    assert.equal(session.autoReact, true);
    assert.equal(botData.statusSettings['bot-123'].autoReact, true);
    assert.equal(saveCount, 1);
    assert.match(sent[0].text, /Auto-React enabled/);
    assert.ok(sent[0].text.includes(`Available reaction emojis (${AUTO_REACT_EMOJIS.length})`));
    for (const emoji of AUTO_REACT_EMOJIS) assert.ok(sent[0].text.includes(emoji));

    await autoreactsCommand(sock, 'chat', {}, true, session, ['status'], botData, () => { saveCount += 1; });
    assert.match(sent[1].text, /Auto-React is ON/);
    assert.equal(sent[1].text.includes(getAutoReactEmojiList()), true);

    await autoreactsCommand(sock, 'chat', {}, true, session, ['off'], botData, () => { saveCount += 1; });
    assert.equal(session.autoReact, false);
    assert.equal(botData.statusSettings['bot-123'].autoReact, false);
    assert.equal(saveCount, 2);
    assert.match(sent[2].text, /Auto-React disabled/);
    assert.equal(sent[2].text.includes(getAutoReactEmojiList()), true);
});

test('autoreact rejects unauthorized users without changing its state', async () => {
    const sent = [];
    const session = { userId: 'bot-123', autoReact: false };
    const sock = { async sendMessage(_chatId, payload) { sent.push(payload); } };

    await autoreactsCommand(sock, 'chat', {}, false, session, ['on'], {}, () => {});

    assert.equal(session.autoReact, false);
    assert.match(sent[0].text, /Only the bot owner or a group admin/);
});

test('WhatsApp device-suffixed JIDs normalize to the configured owner number', () => {
    assert.equal(normalizeJidUserId('923001234567:17@s.whatsapp.net'), '923001234567');
    assert.equal(normalizeJidUserId('923001234567@s.whatsapp.net'), '923001234567');
    assert.equal(normalizeJidUserId('12345@lid'), '12345');
    assert.equal(normalizeJidUserId(undefined), '');
});

test('menu includes callable commands with the configured prefix and excludes internal objects', () => {
    const commands = {
        menu: () => {},
        allmenu: () => {},
        autoreact: () => {},
        autoreacts: () => {},
        ping: () => {},
        utils: { ping: () => {} },
        missing: null
    };
    const output = generateMenuText('Tester', { isPublic: true }, commands, '!');

    assert.deepEqual(getCommandNames(commands), ['menu', 'allmenu', 'autoreact', 'autoreacts', 'ping']);
    assert.match(output, /PREFIX: !/);
    assert.match(output, /!ping/);
    assert.match(output, /!menu/);
    assert.match(output, /!autoreact/);
    assert.match(output, /!autoreacts/);
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
        autoreact: async () => {},
        autoreacts: async () => {},
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
    assert.match(sent[0], /\.autoreact/);
    assert.match(sent[0], /\.autoreacts/);
    assert.doesNotMatch(sent[0], /\.utils|\.akatsuki|\.painquote/);
    assert.match(sent[1], /!ping/);
    assert.match(sent[1], /!menu/);
    assert.match(sent[1], /!autoreact/);
    assert.match(sent[1], /!autoreacts/);
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

test('menu delivery order is cover image, full menu text/footer, then song', async () => {
    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(payload);
            return {};
        }
    };
    const menuText = 'COMPLETE MENU\nOWNER: BALI GIL\nOWNER NUMBER: +123456789\nDEVELOPER: ITACHI UCHIHA';

    await sendMenuWithSong(sock, 'chat', {}, menuText, 'https://example.test/cover.jpg', 'https://example.test/song.mp3');

    assert.deepEqual(sent.map((payload) => Object.keys(payload)[0]), ['image', 'text', 'audio']);
    assert.deepEqual(sent[0].image, { url: 'https://example.test/cover.jpg' });
    assert.equal(sent[0].caption, undefined);
    assert.equal(sent[1].text, menuText);
    assert.deepEqual(sent[2].audio, { url: 'https://example.test/song.mp3' });
});

test('menu tries the image fallback and continues in order', async () => {
    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(payload);
            if (payload.image?.url === 'bad-image') throw new Error('primary image unavailable');
            return {};
        }
    };

    const result = await sendMenuWithSong(sock, 'chat', {}, 'MENU BODY', 'bad-image', 'song-url', ['good-image']);

    assert.deepEqual(sent.map((payload) => Object.keys(payload)[0]), ['image', 'image', 'text', 'audio']);
    assert.equal(sent[1].image.url, 'good-image');
    assert.equal(result.mode, 'image');
    assert.equal(result.menu, 'sent');
    assert.equal(result.song, 'sent');
});

test('menu downloads the cover image to a buffer when direct image URLs fail', async () => {
    const originalFetch = global.fetch;
    const sent = [];
    global.fetch = async () => new Response(Buffer.from('fake-image'), {
        headers: { 'content-type': 'image/png' }
    });
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(payload);
            if (payload.image?.url) throw new Error('direct URL send failed');
            return {};
        }
    };

    try {
        const result = await sendMenuWithSong(sock, 'chat', {}, 'MENU BODY', 'https://example.test/cover.png', 'song-url');
        assert.equal(result.mode, 'image-buffer');
        assert.deepEqual(sent.map((payload) => Object.keys(payload)[0]), ['image', 'image', 'text', 'audio']);
        assert.ok(Buffer.isBuffer(sent[1].image));
        assert.equal(sent[1].mimetype, 'image/png');
    } finally {
        global.fetch = originalFetch;
    }
});

test('menu still sends text and song if every cover image candidate fails', async () => {
    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(Object.keys(payload)[0]);
            if (payload.image) throw new Error('image unavailable');
            return {};
        }
    };

    const result = await sendMenuWithSong(sock, 'chat', {}, 'MENU BODY', 'bad-primary', 'song-url', ['bad-fallback']);

    assert.deepEqual(sent, ['image', 'image', 'text', 'audio']);
    assert.equal(result.mode, 'text-only');
    assert.equal(result.menu, 'sent');
    assert.equal(result.song, 'sent');
});

test('song is still attempted and failure is reported when menu text send fails', async () => {
    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            const type = Object.keys(payload)[0];
            sent.push(type);
            if (type === 'text') throw new Error('text send failed');
            return {};
        }
    };

    const result = await sendMenuWithSong(sock, 'chat', {}, 'MENU BODY', 'cover-url', 'song-url');

    assert.deepEqual(sent, ['image', 'text', 'audio']);
    assert.equal(result.menu, 'failed');
    assert.equal(result.song, 'sent');
});
