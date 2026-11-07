const settings = require('../settings');

function getMenuCredits() {
    const ownerNumbers = String(settings.ownerNumber || '')
        .split(',')
        .map((number) => number.trim())
        .filter(Boolean)
        .map((number) => {
            const normalized = number.replace(/[^\d+]/g, '');
            return normalized && !normalized.startsWith('+') ? `+${normalized}` : normalized;
        })
        .filter(Boolean)
        .join(', ');

    return [
        `OWNER: ${settings.ownerName || 'BALI GIL'}`,
        `OWNER NUMBER: ${ownerNumbers || 'Not configured'}`,
        `DEVELOPER: ${settings.developerName || 'ITACHI UCHIHA'}`
    ];
}

module.exports = { getMenuCredits };
