const DIRECT_CHAT_SUFFIXES = ['@s.whatsapp.net', '@c.us', '@lid', '@hosted'];
const NON_DIRECT_CHAT_SUFFIXES = ['@g.us', '@broadcast', '@newsletter'];

function isDirectChatJid(chatId) {
    const jid = String(chatId || '').trim().toLowerCase();
    if (!jid || NON_DIRECT_CHAT_SUFFIXES.some(suffix => jid.endsWith(suffix))) return false;
    return DIRECT_CHAT_SUFFIXES.some(suffix => jid.endsWith(suffix));
}

function canProcessCommands({ chatId, isDirectChat, isPublic, isOwner, isSessionUser, isMe }) {
    // Direct one-to-one chats must remain usable even when group processing is private.
    // Prefer the handler's structural classification because Baileys can represent
    // direct chats with different JID forms (including LID and hosted JIDs).
    return Boolean(
        isPublic ||
        isDirectChat ||
        isDirectChatJid(chatId) ||
        isOwner ||
        isSessionUser ||
        isMe
    );
}

module.exports = { isDirectChatJid, canProcessCommands };
