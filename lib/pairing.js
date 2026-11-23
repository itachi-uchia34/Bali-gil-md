const WEB_SESSION_ID_PATTERN = /^(?:web_(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})|user_[a-z0-9]{9})$/i;

function isValidWebSessionId(value) {
    return typeof value === 'string' && WEB_SESSION_ID_PATTERN.test(value);
}

function parsePairingRequest(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { error: 'Invalid pairing request.' };
    }

    const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : payload.userId;
    if (!isValidWebSessionId(sessionId)) {
        return { error: 'Invalid pairing session. Refresh the page and try again.' };
    }

    if (typeof payload.number !== 'string' && typeof payload.number !== 'number') {
        return { sessionId, error: 'Enter a WhatsApp number with its country code.' };
    }

    const number = String(payload.number).replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(number)) {
        return { sessionId, error: 'Enter a WhatsApp number with its country code (10–15 digits).' };
    }

    return { sessionId, number };
}

module.exports = { isValidWebSessionId, parsePairingRequest };
