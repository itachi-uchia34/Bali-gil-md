const { normalizeJidUserId } = require('./whatsapp-id');

function normalizeConfiguredNumbers(...values) {
    return [...new Set(values
        .flatMap(value => Array.isArray(value) ? value : String(value || '').split(','))
        .map(value => String(value || '').replace(/\D/g, ''))
        .filter(value => value.length >= 7 && value.length <= 15))];
}

function isConfiguredOwnerNumber(sender, ...configuredValues) {
    const senderNumber = normalizeJidUserId(String(sender || '')).replace(/\D/g, '');
    if (!senderNumber) return false;
    return normalizeConfiguredNumbers(...configuredValues).includes(senderNumber);
}

function getApprovedOwnerCommandNumbers(botData = {}) {
    return normalizeConfiguredNumbers(botData.ownerCommandAccess || []);
}

function isApprovedOwnerCommandUser(sender, botData = {}) {
    const senderNumber = normalizeJidUserId(String(sender || '')).replace(/\D/g, '');
    return Boolean(senderNumber && getApprovedOwnerCommandNumbers(botData).includes(senderNumber));
}

module.exports = {
    normalizeConfiguredNumbers,
    isConfiguredOwnerNumber,
    getApprovedOwnerCommandNumbers,
    isApprovedOwnerCommandUser
};
