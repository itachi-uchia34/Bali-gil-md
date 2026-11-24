const test = require('node:test');
const assert = require('node:assert/strict');
const { AntiAbuseGuard } = require('../lib/anti_abuse');
const disabledMassCommand = require('../commands/disabled-mass-command');
const { generateMenuText, getCommandNames } = require('../lib/menu-text');

function withEnv(values, callback) {
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
    Object.assign(process.env, values);
    try {
        callback();
    } finally {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
}

test('anti-abuse defaults enforce slower pacing and conservative message and broadcast limits', () => {
    withEnv({
        ANTI_ABUSE_ENABLED: 'true',
        ANTI_ABUSE_MIN_DELAY_MS: '',
        ANTI_ABUSE_REACTION_DELAY_MS: '',
        ANTI_ABUSE_MAX_MESSAGES: '',
        ANTI_ABUSE_MAX_BROADCAST: ''
    }, () => {
        const guard = new AntiAbuseGuard();
        assert.equal(guard.enabled, true);
        assert.equal(guard.minDelayMs, 1000);
        assert.equal(guard.reactionDelayMs, 500);
        assert.equal(guard.maxMessagesPerWindow, 30);
        assert.equal(guard.maxBroadcastRecipients, 5);
        assert.equal(guard.assertBroadcastAllowed(5), true);
        assert.throws(() => guard.assertBroadcastAllowed(6), /Use an opt-in group or channel/);
    });
});

test('environment overrides cannot raise anti-abuse limits beyond hard caps', () => {
    withEnv({ ANTI_ABUSE_MAX_MESSAGES: '999', ANTI_ABUSE_MAX_BROADCAST: '999' }, () => {
        const guard = new AntiAbuseGuard();
        assert.equal(guard.maxMessagesPerWindow, 60);
        assert.equal(guard.maxBroadcastRecipients, 5);
    });
});

test('disabled bulk-command warning is sent at most once per chat per hour', async () => {
    const sent = [];
    const sock = { async sendMessage(chatId, payload, options) { sent.push({ chatId, payload, options }); } };
    const msg = { key: { id: 'blocked-message' } };
    await disabledMassCommand(sock, 'safety-test@g.us', msg);
    await disabledMassCommand(sock, 'safety-test@g.us', msg);
    assert.equal(sent.length, 1);
    assert.match(sent[0].payload.text, /disabled to protect recipients/);
    assert.equal(sent[0].options.quoted, msg);
    assert.equal(disabledMassCommand.disabled, true);

    const commands = { menu: () => {}, ping: () => {}, spam: disabledMassCommand };
    assert.deepEqual(getCommandNames(commands), ['menu', 'ping']);
    assert.doesNotMatch(generateMenuText('Tester', {}, commands), /\.spam\b/);
});
