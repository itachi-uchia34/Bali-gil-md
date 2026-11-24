const test = require('node:test');
const assert = require('node:assert/strict');
const autoreplyCommand = require('../commands/autoreply');
const { findMatchingRule } = require('../lib/auto-reply-rules');

function createCommandContext() {
    const sent = [];
    let saves = 0;
    const sock = { sendMessage: async (...args) => sent.push(args) };
    const botData = { statusSettings: {} };
    const session = { userId: 'bot-1', aiEnabled: false, customAutoReplyEnabled: false };
    const saveBotData = () => { saves += 1; };
    return { sock, botData, session, sent, getSaves: () => saves, saveBotData };
}

async function runCommand(context, args, isAdmin = true) {
    await autoreplyCommand(
        context.sock,
        'chat@s.whatsapp.net',
        { key: { id: 'test' } },
        isAdmin,
        context.session,
        args,
        context.botData,
        context.saveBotData,
        context.session.userId
    );
    return context.sent.at(-1)?.[1]?.text || '';
}

test('custom rules match whole words and phrases case-insensitively', () => {
    const rules = [
        { keyword: 'hello', response: 'Hi!' },
        { keyword: 'good morning', response: 'Morning!' }
    ];
    assert.equal(findMatchingRule('Well, HELLO there!', rules), rules[0]);
    assert.equal(findMatchingRule('say good morning to them', rules), rules[1]);
    assert.equal(findMatchingRule('shelloworld', rules), null);
});

test('add stores and enables a rule, and persists the change', async () => {
    const context = createCommandContext();
    const reply = await runCommand(context, ['add', 'hello', '|', 'Hi there']);
    const settings = context.botData.statusSettings['bot-1'];
    assert.deepEqual(settings.autoReplyRules, [{ keyword: 'hello', response: 'Hi there' }]);
    assert.equal(settings.customAutoReplyEnabled, true);
    assert.equal(context.session.customAutoReplyEnabled, true);
    assert.equal(context.session.aiEnabled, false, 'adding a rule does not implicitly enable AI replies');
    assert.equal(context.getSaves(), 1);
    assert.match(reply, /added and enabled/i);
});

test('list and remove manage saved rules without losing AI gate behavior', async () => {
    const context = createCommandContext();
    await runCommand(context, ['add', 'hello', '|', 'Hi']);
    const listed = await runCommand(context, ['list']);
    assert.match(listed, /hello/);
    const removed = await runCommand(context, ['remove', 'hello']);
    assert.match(removed, /removed/i);
    assert.deepEqual(context.botData.statusSettings['bot-1'].autoReplyRules, []);
    assert.equal(context.botData.statusSettings['bot-1'].customAutoReplyEnabled, false);
    assert.equal(context.session.aiEnabled, false);
});

test('on/off preserve the established AI gate and persist keyword gate state', async () => {
    const context = createCommandContext();
    await runCommand(context, ['on']);
    assert.equal(context.session.aiEnabled, true);
    assert.equal(context.session.customAutoReplyEnabled, true);
    assert.equal(context.botData.statusSettings['bot-1'].customAutoReplyEnabled, true);
    await runCommand(context, ['off']);
    assert.equal(context.session.aiEnabled, false);
    assert.equal(context.session.customAutoReplyEnabled, false);
    assert.equal(context.botData.statusSettings['bot-1'].customAutoReplyEnabled, false);
    assert.equal(context.getSaves(), 2);
});

test('non-admin cannot add or persist rules', async () => {
    const context = createCommandContext();
    const reply = await runCommand(context, ['add', 'hello', '|', 'Hi'], false);
    assert.match(reply, /Only the owner or an authorized group admin/i);
    assert.equal(context.botData.statusSettings['bot-1'], undefined);
    assert.equal(context.getSaves(), 0);
});

test('malformed rules and duplicates do not create extra entries', async () => {
    const context = createCommandContext();
    await runCommand(context, ['add', 'hello', '|', 'Hi']);
    const malformed = await runCommand(context, ['add', 'missing-separator']);
    assert.match(malformed, /Use:/);
    const duplicate = await runCommand(context, ['add', 'HELLO', '|', 'Another reply']);
    assert.match(duplicate, /already exists/i);
    assert.equal(context.botData.statusSettings['bot-1'].autoReplyRules.length, 1);
});
