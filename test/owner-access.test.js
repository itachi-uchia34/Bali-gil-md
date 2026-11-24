const test = require('node:test');
const assert = require('node:assert/strict');
const settings = require('../settings');
const isOwner = require('../lib/isOwner');
const { normalizeConfiguredNumbers, isConfiguredOwnerNumber, isApprovedOwnerCommandUser } = require('../lib/owner-access');
const ownerCommand = require('../commands/owner');
const { getMenuCredits } = require('../lib/menu-credits');

test('owner and creator configured numbers normalize to unique country-code digits', () => {
    assert.deepEqual(
        normalizeConfiguredNumbers('+92 (341) 618-1562', ['+92 311 047 0403', '+923416181562', 'invalid']),
        ['923416181562', '923110470403']
    );
});

test('owner-only checks allow only the configured owner and creator, including device-suffixed JIDs', () => {
    const configured = [settings.ownerNumber, settings.creatorNumber];
    const ownerNumber = String(settings.ownerNumber).split(',')[0].replace(/\D/g, '');
    const creatorNumber = String(settings.creatorNumber).split(',')[0].replace(/\D/g, '');

    assert.equal(isConfiguredOwnerNumber(ownerNumber, ...configured), true);
    assert.equal(isConfiguredOwnerNumber(creatorNumber, ...configured), true);
    assert.equal(isConfiguredOwnerNumber('923001112222', ...configured), false);
    assert.equal(isOwner(`${ownerNumber}:4@s.whatsapp.net`), true);
    assert.equal(isOwner(`${creatorNumber}:12@s.whatsapp.net`), true);
    assert.equal(isOwner('923001112222@s.whatsapp.net'), false);
});

test('approved premium numbers can access owner commands and are denied after removal', () => {
    const botData = { ownerCommandAccess: ['+923001234567'] };
    assert.equal(isApprovedOwnerCommandUser('923001234567:8@s.whatsapp.net', botData), true);
    botData.ownerCommandAccess = [];
    assert.equal(isApprovedOwnerCommandUser('923001234567@s.whatsapp.net', botData), false);
    assert.equal(isApprovedOwnerCommandUser('923001234567@s.whatsapp.net', {}), false);
});

test('.owner and .creator profile output shows both updated identities', async () => {
    let sentText = '';
    await ownerCommand({ async sendMessage(_from, payload) { sentText = payload.text; } }, 'chat@s.whatsapp.net', {});
    assert.match(sentText, new RegExp(settings.ownerName));
    assert.match(sentText, new RegExp(String(settings.ownerNumber).split(',')[0].replace(/\D/g, '')));
    assert.match(sentText, new RegExp(settings.creatorName));
    assert.match(sentText, new RegExp(String(settings.creatorNumber).split(',')[0].replace(/\D/g, '')));
});

test('menu credits include both Owner and Creator phone details', () => {
    const credits = getMenuCredits().join('\n');
    assert.match(credits, /OWNER NUMBER:/);
    assert.match(credits, /CREATOR:/);
    assert.match(credits, /CREATOR NUMBER:/);
});
