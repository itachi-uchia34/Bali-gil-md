const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const songCommand = require('../commands/song');
const welcome = require('../commands/welcome');

const { extractQuery, isLikelyAudio, sanitizeTitle, withTimeout } = songCommand._test;

test('play aliases extract the requested song from command text and parsed arguments', () => {
    assert.equal(extractQuery({ message: { conversation: '.play  Naruto Blue Bird ' } }), 'Naruto Blue Bird');
    assert.equal(extractQuery({ message: { extendedTextMessage: { text: '.song https://youtu.be/example' } } }), 'https://youtu.be/example');
    assert.equal(extractQuery({}, '  One Piece opening  '), 'One Piece opening');
});

test('audio validation accepts MP3 metadata, later MP3 frames, and Ogg while rejecting HTML', () => {
    const id3 = Buffer.alloc(4096);
    id3.write('ID3', 0, 'ascii');
    assert.equal(isLikelyAudio(id3), true);

    const framed = Buffer.alloc(4096);
    framed[128] = 0xff;
    framed[129] = 0xfb;
    assert.equal(isLikelyAudio(framed), true);

    const ogg = Buffer.alloc(4096);
    ogg.write('OggS', 0, 'ascii');
    assert.equal(isLikelyAudio(ogg), true);
    assert.equal(isLikelyAudio(Buffer.from('<html>' + 'x'.repeat(5000))), false);
});

test('play title sanitization produces a safe non-empty filename', () => {
    assert.equal(sanitizeTitle('Bad:/ Track?'), 'Bad Track');
    assert.equal(sanitizeTitle(''), 'BALI-GIL-MD-AUDIO');
});

test('play provider timeout rejects a stalled provider without waiting for its eventual response', async () => {
    await assert.rejects(
        withTimeout(() => new Promise(resolve => setTimeout(() => resolve('late'), 40)), 5, 'test provider'),
        /test provider timed out/
    );
});

test('welcome sends the new member profile picture with an aesthetic caption and mention', async () => {
    const originalGet = axios.get;
    axios.get = async () => ({ data: Buffer.from([0xff, 0xd8, 0xff]) });
    const sent = [];
    const sock = {
        async groupMetadata() { return { subject: 'Leaf Village', participants: [{ id: '123@s.whatsapp.net' }] }; },
        async profilePictureUrl(jid, kind) {
            assert.equal(jid, '123@s.whatsapp.net');
            assert.equal(kind, 'image');
            return 'https://avatar.example/member.jpg';
        },
        async sendMessage(chat, payload) { sent.push({ chat, payload }); }
    };
    const botData = { welcomeSettings: { 'group@g.us': { welcomeEnabled: true } } };

    try {
        await welcome.handleParticipantUpdate(sock, {
            id: 'group@g.us', action: 'add', participants: ['123@s.whatsapp.net']
        }, botData);
    } finally {
        axios.get = originalGet;
    }

    assert.equal(sent.length, 1);
    assert.equal(sent[0].chat, 'group@g.us');
    assert.ok(Buffer.isBuffer(sent[0].payload.image));
    assert.match(sent[0].payload.caption, /BALI GIL|BALI GIL/i);
    assert.match(sent[0].payload.caption, /Welcome, @123/);
    assert.match(sent[0].payload.caption, /Leaf Village/);
    assert.deepEqual(sent[0].payload.mentions, ['123@s.whatsapp.net']);
});

test('welcome falls back to a mentioned text message when profile photos are unavailable', async () => {
    const originalGet = axios.get;
    axios.get = async () => { throw new Error('private avatar'); };
    const sent = [];
    const sock = {
        async groupMetadata() { return { subject: 'Akatsuki HQ', participants: [] }; },
        async profilePictureUrl() { return 'https://avatar.example/private.jpg'; },
        async sendMessage(chat, payload) { sent.push({ chat, payload }); }
    };
    const botData = { welcomeSettings: { 'group@g.us': { welcomeEnabled: true } } };

    try {
        await welcome.handleParticipantUpdate(sock, {
            id: 'group@g.us', action: 'invite', participants: [{ id: '456@s.whatsapp.net' }]
        }, botData);
    } finally {
        axios.get = originalGet;
    }

    assert.equal(sent.length, 1);
    assert.match(sent[0].payload.text, /Welcome, @456/);
    assert.deepEqual(sent[0].payload.mentions, ['456@s.whatsapp.net']);
});

test('an explicit per-group welcome opt-out is respected', async () => {
    let sends = 0;
    const sock = { async sendMessage() { sends += 1; } };
    await welcome.handleParticipantUpdate(sock, {
        id: 'group@g.us', action: 'add', participants: ['789@s.whatsapp.net']
    }, { welcomeSettings: { 'group@g.us': { welcomeEnabled: false } } }, null, { defaultWelcomeEnabled: true });
    assert.equal(sends, 0);
});

test('legacy default welcomes remain enabled where no group-specific setting exists', async () => {
    const sent = [];
    const sock = {
        async groupMetadata() { return { subject: 'Hidden Leaf', participants: [] }; },
        async sendMessage(chat, payload) { sent.push(payload); }
    };
    const botData = {};
    await welcome.handleParticipantUpdate(sock, {
        id: 'group@g.us', action: 'add', participants: ['987@s.whatsapp.net']
    }, botData, null, { defaultWelcomeEnabled: true });
    assert.equal(sent.length, 1);
    assert.match(sent[0].text, /Hidden Leaf/);
});

test('welcome falls back to text if WhatsApp rejects the profile-picture message', async () => {
    const originalGet = axios.get;
    axios.get = async () => ({ data: Buffer.from([0xff, 0xd8, 0xff]), headers: { 'content-type': 'image/jpeg' } });
    const sent = [];
    const sock = {
        async groupMetadata() { return { subject: 'Akatsuki HQ', participants: [] }; },
        async profilePictureUrl() { return 'https://avatar.example/member.jpg'; },
        async sendMessage(chat, payload) {
            if (payload.image) throw new Error('image send unavailable');
            sent.push({ chat, payload });
        }
    };

    try {
        await welcome.handleParticipantUpdate(sock, {
            id: 'group@g.us', action: 'add', participants: ['555@s.whatsapp.net']
        }, { welcomeSettings: { 'group@g.us': { welcomeEnabled: true } } });
    } finally {
        axios.get = originalGet;
    }

    assert.equal(sent.length, 1);
    assert.match(sent[0].payload.text, /Welcome, @555/);
    assert.deepEqual(sent[0].payload.mentions, ['555@s.whatsapp.net']);
});
