const settings = require('../settings');

const CLOSE_MESSAGES = [
    `🩸 *━───── 🔴 PAIN’S SILENT SHROUD 🔴 ─────━* 🩸\n\n🌀 *BLACK RECEIVER SEAL ACTIVATED*\n\nThe group has entered *Almighty Silence*. Only admins may speak while the Six Paths observe.\n\n> _"Feel pain. Contemplate pain. Accept pain."_\n\nUse *.gcon* to restore the voices of the organization.`,
    `🌑 *AKATSUKI LOCKDOWN // SILENT SHROUD DEPLOYED* 🌑\n\nThe cloak has covered this battlefield. Public conversation is sealed; command belongs to the village guardians.\n\n> _"The world shall know pain."_\n\nUse *.gcon* when the Shroud is ready to open.`,
    `⚫ *PAIN’S SIX PATHS: QUIET PROTOCOL* ⚫\n\nThe receivers are active and the group gates are closed. Admins retain the voice of command.\n\n🩸 *Status:* MEMBERS MUTED // ADMINS AUTHORIZED\n\nUse *.gcon* to reconnect every path.`
];

const OPEN_MESSAGES = [
    `🩸 *━───── 🔴 PAIN’S SHROUD RELEASED 🔴 ─────━* 🩸\n\n🌀 *ALL PATHS RECONNECTED*\n\nThe group is open again. Every member may speak while the Six Paths return to watchful silence.\n\n> _"Peace is not something that can be given. It must be understood."_\n\nUse *.gcoff* to invoke Almighty Silence again.`,
    `☁️ *AKATSUKI LOCKDOWN LIFTED // VILLAGE OPEN* ☁️\n\nThe mist has cleared and the village gates are open. Speak with purpose; the Shroud is still watching.\n\n> _"Where there is light, shadows also lurk."_\n\nUse *.gcoff* to seal the battlefield again.`,
    `⚔️ *KAGE SUMMIT: VOICE CHANNEL RESTORED* ⚔️\n\nThe command barrier has been removed. All members may speak, but respect remains the law of the village.\n\n🩸 *Status:* MEMBERS AUTHORIZED // PEACE PROTOCOL ACTIVE\n\nUse *.gcoff* when the group requires silence.`
];

function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function soundCandidates(url, fallbacks = []) {
    return [...new Set([url, ...(Array.isArray(fallbacks) ? fallbacks : [])].filter(Boolean))];
}

async function sendOptionalSound(sock, chatId, msg, soundUrl, fileName, soundFallbacks = []) {
    const candidates = soundCandidates(soundUrl, soundFallbacks);
    if (!candidates.length) return { sent: false, reason: 'not-configured' };
    for (const candidate of candidates) {
        try {
            await sock.sendMessage(chatId, {
                audio: { url: candidate },
                mimetype: 'audio/mpeg',
                fileName,
                ptt: false
            }, { quoted: msg });
            return { sent: true, url: candidate };
        } catch (error) {
            console.warn(`Group mode sound effect failed for ${candidate}:`, error.message || error);
        }
    }
    return { sent: false };
}

async function sendGroupModeResponse(sock, chatId, msg, isOpen) {
    const messages = isOpen ? OPEN_MESSAGES : CLOSE_MESSAGES;
    const soundUrl = isOpen ? settings.groupOpenSound : settings.groupCloseSound;
    const soundFallbacks = isOpen ? settings.groupOpenSoundFallbacks : settings.groupCloseSoundFallbacks;
    const text = pick(messages);
    await sock.sendMessage(chatId, { text }, { quoted: msg });
    const sound = await sendOptionalSound(
        sock,
        chatId,
        msg,
        soundUrl,
        isOpen ? 'bali-gil-md-group-open.mp3' : 'bali-gil-md-group-close.mp3',
        soundFallbacks
    );
    return { text, sound };
}

module.exports = { sendGroupModeResponse, sendOptionalSound, CLOSE_MESSAGES, OPEN_MESSAGES };
