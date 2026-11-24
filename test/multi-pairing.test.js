const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidWebSessionId, parsePairingRequest } = require('../lib/pairing');

test('pairing accepts isolated UUID sessions and legacy browser session IDs only', () => {
    assert.equal(isValidWebSessionId('web_123e4567-e89b-42d3-a456-426614174000'), true);
    assert.equal(isValidWebSessionId('web_123e4567e89b42d3a456426614174000'), true);
    assert.equal(isValidWebSessionId('user_abc123def'), true);
    for (const unsafe of ['../escape', '../../auth_info', '__proto__', 'constructor', 'web_x', '', null, 123]) {
        assert.equal(isValidWebSessionId(unsafe), false);
    }
});

test('pairing normalizes a valid number and preserves its session identifier', () => {
    assert.deepEqual(parsePairingRequest({
        sessionId: 'web_123e4567-e89b-42d3-a456-426614174000',
        number: '+1 (202) 555-0142'
    }), {
        sessionId: 'web_123e4567-e89b-42d3-a456-426614174000',
        number: '12025550142'
    });
});

test('pairing accepts legacy userId payloads without permitting unsafe paths', () => {
    assert.deepEqual(parsePairingRequest({ userId: 'user_abc123def', number: '923300000000' }), {
        sessionId: 'user_abc123def',
        number: '923300000000'
    });
    assert.match(parsePairingRequest({ userId: '../escape', number: '923300000000' }).error, /Invalid pairing session/);
});

test('pairing rejects malformed requests and phone numbers outside 10 to 15 digits', () => {
    assert.match(parsePairingRequest(null).error, /Invalid pairing request/);
    assert.match(parsePairingRequest({ sessionId: 'web_123e4567-e89b-42d3-a456-426614174000', number: '123456789' }).error, /10–15 digits/);
    assert.match(parsePairingRequest({ sessionId: 'web_123e4567-e89b-42d3-a456-426614174000', number: '1234567890123456' }).error, /10–15 digits/);
});


test('dashboard keeps pairing codes and connection statuses isolated per account', () => {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
    const scriptMatch = html.match(/\/\* ---------------- Pairing logic ---------------- \*\/([\s\S]*?)socket\.on\('stats'/);
    assert.ok(scriptMatch, 'pairing dashboard script section should exist');

    function element() {
        return {
            children: [], events: {}, style: {}, className: '', value: '', disabled: false,
            classList: { add() {}, remove() {} },
            addEventListener(name, callback) { this.events[name] = callback; },
            append(...children) { this.children.push(...children); },
            appendChild(child) { this.children.push(child); },
            replaceChildren(...children) { this.children = children; },
            setAttribute() {}
        };
    }

    const nodes = {
        phone: element(), requestPairing: element(), requestQr: element(), pairingSessions: element()
    };
    const status = element();
    const emitted = [];
    const handlers = {};
    const socket = {
        connected: true,
        on(name, callback) { handlers[name] = callback; },
        emit(name, payload) { emitted.push({ name, payload }); }
    };
    let uuidCount = 0;
    const context = {
        window: { crypto: { randomUUID: () => `123e4567-e89b-42d3-a456-42661417400${uuidCount++}` } },
        document: { getElementById: id => nodes[id] || status, createElement: element },
        localStorage: { getItem: () => null, setItem() {} },
        navigator: {},
        io: () => socket,
        setStatus() {}, showToast() {},
        setTimeout: () => 1, clearTimeout() {},
        setInterval: () => 1, clearInterval() {},
        console
    };
    vm.runInNewContext(scriptMatch[1], context);

    const button = nodes.requestPairing;
    const phone = nodes.phone;
    phone.value = '+1 (202) 555-0101';
    button.events.click();
    const firstRequest = emitted.find(item => item.name === 'pair-request').payload;
    handlers['pairing-started']({ sessionId: firstRequest.sessionId });

    phone.value = '+44 20 7946 0958';
    button.events.click();
    const requests = emitted.filter(item => item.name === 'pair-request').map(item => item.payload);
    const secondRequest = requests[1];
    assert.notEqual(firstRequest.sessionId, secondRequest.sessionId);
    handlers['pairing-started']({ sessionId: secondRequest.sessionId });

    handlers['pairing-code']({ sessionId: firstRequest.sessionId, code: '1111 2222' });
    handlers['pairing-code']({ sessionId: secondRequest.sessionId, code: '3333 4444' });
    handlers['connection-status']({ sessionId: firstRequest.sessionId, connected: true, connecting: false });
    nodes.requestQr.events.click();
    const qrRequest = emitted.find(item => item.name === 'qr-request').payload;
    assert.ok(emitted.some(item => item.name === 'set-user' && item.payload === qrRequest.sessionId));
    handlers['pairing-started']({ sessionId: qrRequest.sessionId, method: 'qr' });
    handlers['pairing-qr']({ sessionId: qrRequest.sessionId, dataUrl: 'data:image/png;base64,AAAA', expiresIn: 60 });

    const sessions = vm.runInNewContext('[...pairingSessions.values()]', context);
    assert.equal(sessions.length, 3);
    assert.equal(sessions[0].code, '');
    assert.equal(sessions[0].connected, true);
    assert.equal(sessions[0].last4, '0101');
    assert.equal(sessions[1].code, '3333-4444');
    assert.equal(sessions[1].connected, false);
    assert.equal(sessions[1].last4, '0958');
    assert.equal(sessions[2].qrDataUrl, 'data:image/png;base64,AAAA');
    assert.equal(sessions[2].last4, 'QR');
});

test('server captures startup QR events and saves credentials before requesting a pairing code', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
    const captureIndex = source.indexOf("this.sock.ev.on('connection.update', captureStartupConnectionUpdate)");
    const credsIndex = source.indexOf("this.sock.ev.on('creds.update', saveCreds)");
    const requestIndex = source.indexOf('this.sock.requestPairingCode(pairingNumber)');
    assert.ok(captureIndex >= 0 && credsIndex >= 0 && requestIndex >= 0);
    assert.ok(captureIndex < requestIndex, 'startup connection updates must be captured before the code request');
    assert.ok(credsIndex < requestIndex, 'pairing credentials must be saved before the code request');
});
