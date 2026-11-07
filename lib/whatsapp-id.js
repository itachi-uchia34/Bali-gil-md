function normalizeJidUserId(jid) {
    if (typeof jid !== 'string' || !jid) return '';
    const userPart = jid.split('@')[0];
    return userPart.split(':')[0];
}

module.exports = { normalizeJidUserId };
