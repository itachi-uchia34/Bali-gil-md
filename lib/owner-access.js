function normalizeConfiguredNumbers(...values) {
    return [...new Set(values
        .flatMap(value => Array.isArray(value) ? value : String(value || '').split(','))
        .map(value => String(value || '').replace(/\D/g, ''))
        .filter(value => value.length >= 7 && value.length <= 15))];
}

function isConfiguredOwnerNumber(sender, ...configuredValues) {
    const senderNumber = String(sender || '').replace(/\D/g, '');
    if (!senderNumber) return false;
    return normalizeConfiguredNumbers(...configuredValues).includes(senderNumber);
}

module.exports = { normalizeConfiguredNumbers, isConfiguredOwnerNumber };
