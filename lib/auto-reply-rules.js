function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatchingRule(text = '', rules = []) {
    const normalizedText = String(text).normalize('NFKC');
    for (const rule of Array.isArray(rules) ? rules : []) {
        const keyword = String(rule?.keyword || '').trim().normalize('NFKC');
        const response = String(rule?.response || '').trim();
        if (!keyword || !response) continue;
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp(keyword)}(?=$|[^\\p{L}\\p{N}_])`, 'iu');
        if (pattern.test(normalizedText)) return rule;
    }
    return null;
}

module.exports = { findMatchingRule };
