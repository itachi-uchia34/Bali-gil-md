const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const settings = require('../settings');
const channel = require('../commands/channel');
const directdl = require('../commands/directdl');
const levels = require('../commands/levels');
const dpz = require('../commands/dpz');
const moderation = require('../commands/moderation');
const menuCommand = require('../commands/menu');

test('imported reference feature modules expose their expected handlers and DPZ images', () => {
    assert.equal(typeof directdl, 'function');
    assert.equal(typeof levels.handleActivity, 'function');
    assert.equal(typeof dpz.dpzCommand, 'function');
    assert.equal(typeof moderation.handleMessage, 'function');
    assert.equal(fs.existsSync(path.join(__dirname, '..', 'assets', 'dpz_boy_01_warrior.jpg')), true);
    assert.equal(fs.existsSync(path.join(__dirname, '..', 'assets', 'madara_menu.png')), false);
});

test('direct-download rejects private and loopback destinations', () => {
    const { isBlockedHost } = directdl._test;
    assert.equal(isBlockedHost('127.0.0.1'), true);
    assert.equal(isBlockedHost('localhost'), true);
    assert.equal(isBlockedHost('192.168.1.10'), true);
    assert.equal(isBlockedHost('example.com'), false);
});

test('channel configuration is stored per Bali session and shown by the channel command', async () => {
    const botData = { channelSettings: {} };
    const replies = [];
    const sock = { sendMessage: async (_jid, payload) => replies.push(payload.text) };
    const msg = { key: { remoteJid: 'owner@s.whatsapp.net' } };
    let saves = 0;
    const saveBotData = () => { saves += 1; };

    await channel.setChannelCommand(sock, 'owner@s.whatsapp.net', msg, true,
        'https://whatsapp.com/channel/TestCode', botData, saveBotData, 'web_session_a');
    await channel.setChannelCommand(sock, 'owner@s.whatsapp.net', msg, true,
        '120363123456789012@newsletter', botData, saveBotData, 'web_session_b');
    await channel.channelCommand(sock, 'owner@s.whatsapp.net', msg, true, botData, 'web_session_a');

    assert.equal(saves, 2);
    assert.equal(botData.channelSettings.web_session_a.url, 'https://whatsapp.com/channel/TestCode');
    assert.equal(botData.channelSettings.web_session_b.jid, '120363123456789012@newsletter');
    assert.match(replies.at(-1), /TestCode/);
});

test('menu appends only the current session channel while retaining Bali identity and image settings', async () => {
    const previous = {
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
    const sock = { sendMessage: async (_jid, payload) => { sent.push(payload); return {}; } };
    try {
        await menuCommand(sock, 'owner@s.whatsapp.net', { pushName: 'Ali' },
            { userId: 'web_session_a', isPublic: true }, { menu: async () => {} }, {
                channelSettings: {
                    web_session_a: { display: 'https://whatsapp.com/channel/TestCode' },
                    web_session_b: { display: 'other-session-channel' }
                }
            }, '.');
        const menuText = sent.map((item) => item.text || '').join('\n');
        assert.match(menuText, /𝗕𝗔𝗟𝗜 𝗚𝗜𝗟 𝗠𝗗/);
        assert.match(menuText, /TestCode/);
        assert.doesNotMatch(menuText, /other-session-channel/);
    } finally {
        Object.assign(settings, previous);
    }
});
