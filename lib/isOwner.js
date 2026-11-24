const settings = require('../settings');
const { normalizeJidUserId } = require('./whatsapp-id');
const { isConfiguredOwnerNumber } = require('./owner-access');

function isOwner(senderId) {
    return isConfiguredOwnerNumber(normalizeJidUserId(String(senderId || '')), settings.ownerNumber, settings.creatorNumber);
}

module.exports = isOwner;
