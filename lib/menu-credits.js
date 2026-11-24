const settings = require('../settings');

function getMenuCredits() {
    const formatNumbers = (value) => String(value || '')
        .split(',')
        .map((number) => number.replace(/\D/g, ''))
        .filter(Boolean)
        .map((number) => `+${number}`)
        .join(', ');

    return [
        `OWNER: ${settings.ownerName || 'BALI-GIL'}`,
        `OWNER NUMBER: ${formatNumbers(settings.ownerNumber) || 'Not configured'}`,
        `CREATOR: ${settings.creatorName || settings.developerName || 'ITACHI-UCHIHA'}`,
        `CREATOR NUMBER: ${formatNumbers(settings.creatorNumber) || 'Not configured'}`
    ];
}

module.exports = { getMenuCredits };
