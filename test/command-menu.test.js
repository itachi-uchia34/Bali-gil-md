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
const menuCommand = require('../commands/menu');
const settings = require('../settings');
const { runPreCommandHooks } = require('../lib/precommand-hooks');
const { buildMenuFailureMessage, reportMenuFailure } = require('../lib/menu-failure');
const { installThemedSocket } = require('../lib/akatsuki-theme');
const { wrapCommandHandler } = require('../lib/command-wrapper');

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

test('menu handler failures produce a useful in-chat diagnostic', async () => {
    const sent = [];
    const sock = { async sendMessage(chatId, payload, options) { sent.push({ chatId, payload, options }); } };
    const msg = { key: { id: 'self-chat-menu' } };
    assert.match(buildMenuFailureMessage('menu', '.', new Error('render failed')), /\.menu could not be displayed\. render failed/);
    assert.equal(await reportMenuFailure(sock, 'self-chat', msg, 'menu', '.', new Error('render failed')), true);
    assert.equal(sent[0].chatId, 'self-chat');
    assert.equal(sent[0].options.quoted, msg);
    assert.match(sent[0].payload.text, /\.help/);
});

test('pre-command hook failures cannot prevent subsequent command processing', async () => {
    const called = [];
    const errors = [];

    await runPreCommandHooks({
        sock: {},
        msg: { key: { id: 'message-1' } },
        handleAutoread: async () => { called.push('autoread'); throw new Error('read receipt failed'); },
        storeMessage: async () => { called.push('store'); },
        handleSnipe: () => { called.push('snipe'); },
        onError: (hook) => errors.push(hook)
    });

    assert.deepEqual(called, ['autoread', 'store', 'snipe']);
    assert.deepEqual(errors, ['autoread']);
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

test('dedicated menu command sends complete menu text before optional cover and song', async () => {
    const original = {
        startimage: settings.startimage,
        startimageFallbacks: settings.startimageFallbacks,
        startsong: settings.startsong,
        startsongFallbacks: settings.startsongFallbacks
    };
    settings.startimage = 'test-cover-url';
    settings.startimageFallbacks = [];
    settings.startsong = 'test-song-url';
    settings.startsongFallbacks = [];

    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(payload);
            return {};
        }
    };
    const commands = { menu: async () => {}, ping: async () => {} };

    try {
        const result = await menuCommand(
            sock,
            'test-chat',
            { pushName: 'Tester' },
            { userId: 'test-bot', isPublic: false },
            commands,
            { userNames: { 'test-bot': 'Saved Tester' } },
            '!'
        );

        assert.deepEqual(sent.map((payload) => Object.keys(payload)[0]), ['text', 'image', 'audio']);
        assert.ok(sent[0].text.includes('USER: Saved Tester'));
        assert.ok(sent[0].text.includes('PREFIX: !'));
        assert.ok(sent[0].text.includes('OWNER NUMBER:'));
        assert.ok(sent[0].text.includes('DEVELOPER:'));
        assert.deepEqual(sent[1].image, { url: 'test-cover-url' });
        assert.deepEqual(sent[2].audio, { url: 'test-song-url' });
        assert.deepEqual(result, { mode: 'image', imageUrl: 'test-cover-url', menu: 'sent', song: 'sent', songUrl: 'test-song-url', delivery: 'url' });
    } finally {
        Object.assign(settings, original);
    }
});

test('dedicated menu command still sends text and song and reports a missing cover', async () => {
    const original = {
        startimage: settings.startimage,
        startimageFallbacks: settings.startimageFallbacks,
        startsong: settings.startsong,
        startsongFallbacks: settings.startsongFallbacks
    };
    const originalFetch = global.fetch;
    settings.startimage = 'https://invalid.test/cover.png';
    settings.startimageFallbacks = [];
    settings.startsong = 'test-song-url';
    settings.startsongFallbacks = [];
    global.fetch = async () => new Response('not found', { status: 404 });

    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(payload);
            if (payload.image) throw new Error('cover send failed');
            return {};
        }
    };

    try {
        const result = await menuCommand(sock, 'test-chat', {}, { userId: 'test-bot' }, { menu: async () => {} }, {}, '.');

        assert.deepEqual(sent.map((payload) => Object.keys(payload)[0]), ['text', 'image', 'audio', 'text']);
        assert.ok(sent[0].text.includes('PREFIX: .'));
        assert.ok(sent[0].text.includes('𝗕𝗔𝗟𝗜 𝗚𝗜𝗟 𝗠𝗗'));
        assert.ok(sent[0].text.includes('.menu'));
        assert.ok(sent[3].text.includes('Could not deliver cover image'));
        assert.equal(result.mode, 'text-only');
        assert.equal(result.menu, 'sent');
        assert.equal(result.song, 'sent');
    } finally {
        Object.assign(settings, original);
        global.fetch = originalFetch;
    }
});

test('dedicated menu command retries text after a transient initial send failure', async () => {
    const original = {
        startimage: settings.startimage,
        startimageFallbacks: settings.startimageFallbacks,
        startsong: settings.startsong,
        startsongFallbacks: settings.startsongFallbacks
    };
    settings.startimage = '';
    settings.startimageFallbacks = [];
    settings.startsong = '';
    settings.startsongFallbacks = [];
    const sent = [];
    let textAttempts = 0;
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(payload);
            if (payload.text?.includes('PREFIX: .') && ++textAttempts === 1) throw new Error('temporary transport failure');
            return {};
        }
    };

    try {
        const result = await menuCommand(sock, 'test-chat', {}, { userId: 'test-bot' }, { menu: async () => {} }, {}, '.');
        assert.equal(textAttempts, 2);
        assert.match(sent[1].text, /PREFIX: \./);
        assert.equal(result.menu, 'sent');
    } finally {
        Object.assign(settings, original);
    }
});

test('.menu sends its command list through the global style hook and command wrapper', async () => {
    const original = {
        startimage: settings.startimage,
        startimageFallbacks: settings.startimageFallbacks,
        startsong: settings.startsong,
        startsongFallbacks: settings.startsongFallbacks
    };
    settings.startimage = '';
    settings.startimageFallbacks = [];
    settings.startsong = '';
    settings.startsongFallbacks = [];
    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(payload);
            return {};
        }
    };
    installThemedSocket(sock);

    try {
        const wrappedMenu = wrapCommandHandler(menuCommand);
        const result = await wrappedMenu(sock, 'chat', {}, { userId: 'menu-user', isPublic: true }, { menu: async () => {}, ping: async () => {} }, {}, '.');
        assert.equal(sent[0].text.startsWith('╔'), true);
        assert.match(sent[0].text, /\.menu/);
        assert.match(sent[0].text, /\.ping/);
        assert.equal(result.menu, 'sent');
    } finally {
        Object.assign(settings, original);
    }
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

    assert.match(sent[0], /𝗕𝗔𝗟𝗜 𝗚𝗜𝗟 𝗠𝗗 𝗛𝗘𝗟𝗣/);
    assert.match(sent[0], /📜 AKATSUKI GUIDANCE/);
    assert.match(sent[0], /\.ping/);
    assert.match(sent[0], /\.autoreact/);
    assert.match(sent[0], /\.autoreacts/);
    assert.doesNotMatch(sent[0], /\.utils|\.akatsuki|\.painquote/);
    assert.match(sent[1], /!ping/);
    assert.match(sent[1], /!menu/);
    assert.match(sent[1], /!autoreact/);
    assert.match(sent[1], /!autoreacts/);
    assert.match(sent[1], /𝗕𝗔𝗟𝗜 𝗚𝗜𝗟 𝗠𝗗 𝗔𝗟𝗟 𝗠𝗘𝗡𝗨/);
    assert.match(sent[1], /𝗦𝗜𝗫 𝗣𝗔𝗧𝗛𝗦 𝗧𝗢𝗢𝗟𝗞𝗜𝗧/);
    assert.doesNotMatch(sent[1], /!𝗽𝗶𝗻𝗴/);
    for (const menu of sent) {
        assert.match(menu, /OWNER: BALI GIL/);
        assert.match(menu, /OWNER NUMBER: \+?\d+/);
        assert.match(menu, /DEVELOPER: ITACHI UCHIHA/);
    }
    assert.doesNotMatch(sent[1], /!utils/);
});

test('allmenu deduplicates valid plugin names and tolerates malformed plugin input', async () => {
    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            if (payload.image) throw new Error('Use the text fallback in this test');
            sent.push(payload.text);
        }
    };
    const commands = { allmenu: async () => {}, 'custom-plugin': async () => {}, ping: async () => {} };

    await allMenuCommand(sock, 'chat', {}, { isPublic: true }, commands, ['custom-plugin', 'custom-plugin', '', 42], '!');
    assert.equal((sent[0].match(/!custom-plugin/g) || []).length, 1);
    assert.match(sent[0], /𝗔𝗞𝗔𝗧𝗦𝗨𝗞𝗜 𝗣𝗟𝗨𝗚𝗜𝗡𝗦/);
    assert.match(sent[0], /!ping/);

    sent.length = 0;
    await allMenuCommand(sock, 'chat', {}, { isPublic: true }, commands, null, '!');
    assert.match(sent[0], /!custom-plugin/);
    assert.doesNotMatch(sent[0], /𝗔𝗞𝗔𝗧𝗦𝗨𝗞𝗜 𝗣𝗟𝗨𝗚𝗜𝗡𝗦/);
    assert.match(sent[0], /!ping/);
});

test('anime command handles missing query without making a network request', async () => {
    const sent = [];
    const sock = { async sendMessage(_chatId, payload) { sent.push(payload.text); } };

    await animeCommand(sock, 'chat', {}, '');

    assert.match(sent[0], /\.anime <anime name>/);
});

test('menu delivery order is full menu text, cover image, then song', async () => {
    const sent = [];
    const sock = {
        async sendMessage(_chatId, payload) {
            sent.push(payload);
            return {};
        }
    };
    const menuText = 'COMPLETE MENU\nOWNER: BALI GIL\nOWNER NUMBER: +123456789\nDEVELOPER: ITACHI UCHIHA';

    await sendMenuWithSong(sock, 'chat', {}, menuText, 'https://example.test/cover.jpg', 'https://example.test/song.mp3');

    assert.deepEqual(sent.map((payload) => Object.keys(payload)[0]), ['text', 'image', 'audio']);
    assert.equal(sent[0].text, menuText);
    assert.deepEqual(sent[1].image, { url: 'https://example.test/cover.jpg' });
    assert.equal(sent[1].caption, undefined);
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

    assert.deepEqual(sent.map((payload) => Object.keys(payload)[0]), ['text', 'image', 'image', 'audio']);
    assert.equal(sent[2].image.url, 'good-image');
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
        assert.deepEqual(sent.map((payload) => Object.keys(payload)[0]), ['text', 'image', 'image', 'audio']);
        assert.ok(Buffer.isBuffer(sent[2].image));
        assert.equal(sent[2].mimetype, 'image/png');
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

    assert.deepEqual(sent, ['text', 'image', 'image', 'audio']);
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

    assert.deepEqual(sent, ['text', 'text', 'image', 'audio']);
    assert.equal(result.menu, 'failed');
    assert.equal(result.song, 'sent');
});
