const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { toAudio } = require('../lib/converter');

module.exports = async function(sock, chatId, msg) {
    try {
        const quoted = msg.message?.videoMessage ||
            msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
        
        if (!quoted) return await sock.sendMessage(chatId, { text: '\u26A0\uFE0F Reply to a video!' }, { quoted: msg });
        
        await sock.sendMessage(chatId, { text: '\u1F3B5 Converting to MP3...' }, { quoted: msg });
        
        const stream = await downloadContentFromMessage(quoted, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        if (!buffer.length) throw new Error('The replied video could not be downloaded.');
        const mp3 = await toAudio(buffer, 'mp4');
        if (!mp3.length) throw new Error('Audio conversion produced an empty file.');
        
        await sock.sendMessage(chatId, { 
            audio: mp3,
            mimetype: 'audio/mpeg',
            fileName: 'converted.mp3',
            ptt: false
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(chatId, { text: '\u274C Error: ' + e.message }, { quoted: msg });
    }
};
