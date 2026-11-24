const test = require('node:test');
const assert = require('node:assert/strict');
const settings = require('../settings');
const ownerAccess = require('../commands/owneraccess');

const creatorNumber = String(settings.creatorNumber).replace(/\D/g, '');
const unapprovedNumber = '923001234567';

function setup() {
    const sent = [];
    const botData = { ownerCommandAccess: [] };
    let saves = 0;
    const sock = { async sendMessage(_chatId, payload) { sent.push(payload.text); } };
    const saveBotData = () => { saves += 1; };
    return { sent, botData, sock, saveBotData, get saves() { return saves; } };
}

test('only configured Owner/Creator can grant premium owner-command access', async () => {
    const state = setup();
    await ownerAccess(state.sock, 'chat', {}, `${unapprovedNumber}@s.whatsapp.net`, ['grant', unapprovedNumber], state.botData, state.saveBotData);
    assert.deepEqual(state.botData.ownerCommandAccess, []);
    assert.equal(state.saves, 0);
    assert.match(state.sent[0], /Only the configured Owner or Creator/);

    await ownerAccess(state.sock, 'chat', {}, `${creatorNumber}@s.whatsapp.net`, ['grant', unapprovedNumber], state.botData, state.saveBotData);
    assert.deepEqual(state.botData.ownerCommandAccess, [unapprovedNumber]);
    assert.equal(state.saves, 1);
    assert.match(state.sent[1], /approved for/);
});

test('Creator can revoke and list premium access and approvals persist through save callback', async () => {
    const state = setup();
    state.botData.ownerCommandAccess = [unapprovedNumber];
    await ownerAccess(state.sock, 'chat', {}, `${creatorNumber}@s.whatsapp.net`, ['list'], state.botData, state.saveBotData);
    assert.match(state.sent[0], new RegExp(unapprovedNumber));

    await ownerAccess(state.sock, 'chat', {}, `${creatorNumber}@s.whatsapp.net`, ['revoke', unapprovedNumber], state.botData, state.saveBotData);
    assert.deepEqual(state.botData.ownerCommandAccess, []);
    assert.equal(state.saves, 1);
    assert.match(state.sent[1], /revoked/);
});
