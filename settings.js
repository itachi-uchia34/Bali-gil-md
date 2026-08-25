const path = require('path');

module.exports = {
    startimage: 'https://lh3.googleusercontent.com/d/18DX3oRbQ1E__z-64MUMOM-mRtmSfsLqr',
    startimageFallbacks: ['https://github.com/itachi-uchia34.png?size=512'],
    // Use the checked-in asset first so startup/menu audio does not depend on a remote CDN.
    startsong: process.env.START_SONG_URL || path.join(__dirname, 'song.mp3'),
    startsongFallbacks: (process.env.START_SONG_FALLBACKS || 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663880710751/lvQmtEqreSiSbYgE.mp3').split(',').map((url) => url.trim()).filter(Boolean),
    groupCloseSound: process.env.GROUP_CLOSE_SOUND_URL || '',
    groupCloseSoundFallbacks: (process.env.GROUP_CLOSE_SOUND_FALLBACKS || '').split(',').map((url) => url.trim()).filter(Boolean),
    groupOpenSound: process.env.GROUP_OPEN_SOUND_URL || '',
    groupOpenSoundFallbacks: (process.env.GROUP_OPEN_SOUND_FALLBACKS || '').split(',').map((url) => url.trim()).filter(Boolean),
    galiSound: process.env.GALI_AUDIO_URL || '',
    galiSoundFallbacks: (process.env.GALI_AUDIO_FALLBACKS || '').split(',').map((url) => url.trim()).filter(Boolean),
    gconSound: process.env.GCON_AUDIO_URL || process.env.GROUP_OPEN_SOUND_URL || '',
    gconSoundFallbacks: (process.env.GCON_AUDIO_FALLBACKS || process.env.GROUP_OPEN_SOUND_FALLBACKS || '').split(',').map((url) => url.trim()).filter(Boolean),
    ownerNumber: process.env.OWNER_NUMBER || '+923196181562',
    botName: 'BALI GIL MD',
    ownerName: 'BALI GIL',
    whatsappChannel: 'https://whatsapp.com/channel/0029VbC1gR3J3jv22YgI511b',
    tgOwnerId: process.env.OWNER_TELEGRAM_ID || '5659752731',
    premiumUsers: [],
    connectedBots: [],
    version: '3.0.0',
    prefix: '.'
};
