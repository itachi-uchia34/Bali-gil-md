const DEFAULT_TTL_MS = 15000;
const MAX_CACHE_ENTRIES = 256;

function getGroupMetadataCached(sock, cache, groupId, options = {}) {
    const ttlMs = Math.max(1000, Number(options.ttlMs) || DEFAULT_TTL_MS);
    const now = typeof options.now === 'function' ? options.now : Date.now;
    const currentTime = now();

    for (const [key, entry] of cache) {
        if (entry.expiresAt <= currentTime) cache.delete(key);
    }

    const existing = cache.get(groupId);
    if (existing && existing.expiresAt > currentTime) return existing.promise;

    const entry = { expiresAt: Number.POSITIVE_INFINITY, promise: null };
    entry.promise = Promise.resolve()
        .then(() => sock.groupMetadata(groupId))
        .then((metadata) => {
            entry.expiresAt = now() + ttlMs;
            return metadata;
        })
        .catch((error) => {
            if (cache.get(groupId) === entry) cache.delete(groupId);
            throw error;
        });
    cache.set(groupId, entry);

    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
    return entry.promise;
}

module.exports = { getGroupMetadataCached, DEFAULT_TTL_MS, MAX_CACHE_ENTRIES };
