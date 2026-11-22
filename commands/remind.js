const reminders = new Map();
const MAX_REMINDER_MINUTES = Math.floor(0x7fffffff / 60000);

module.exports = async function(sock, chatId, msg, q) {
    const input = String(q ?? '').trim();
    const match = input.match(/^(\S+)\s+([\s\S]+)$/);
    if (!match) {
        return sock.sendMessage(chatId, { text: '.remind <whole minutes> <message>' }, { quoted: msg });
    }
    const [, rawMinutes, reminderText] = match;
    if (!/^[1-9]\d*$/.test(rawMinutes)) {
        return sock.sendMessage(chatId, { text: `.remind <whole minutes> <message> (1–${MAX_REMINDER_MINUTES} minutes)` }, { quoted: msg });
    }
    const minutes = Number(rawMinutes);
    if (!Number.isSafeInteger(minutes) || minutes > MAX_REMINDER_MINUTES) {
        return sock.sendMessage(chatId, { text: `Reminder duration must be between 1 and ${MAX_REMINDER_MINUTES} minutes.` }, { quoted: msg });
    }

    const ms = minutes * 60 * 1000;
    const id = `${Date.now()}-${reminders.size}`;
    await sock.sendMessage(chatId, { text: `⏰ Reminder set for ${minutes} minute(s)!\n\nMessage: ${reminderText}` }, { quoted: msg });
    const timeout = setTimeout(async () => {
        try {
            await sock.sendMessage(chatId, { text: `⏰ *REMINDER!*\n\n${reminderText}\n\n_Set ${minutes}m ago_` });
        } catch (_) {
            // Sending can fail if the chat/session is no longer available.
        } finally {
            reminders.delete(id);
        }
    }, ms);
    reminders.set(id, { timeout, text: reminderText });
};
