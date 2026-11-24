const settings = require('../settings');

const REPOSITORY_URL = 'https://github.com/itachi-uchia34/Madara-Uchiha-MD';

module.exports = async function repoCommand(sock, chatId, msg) {
    const sendMsg = text => sock.sendMessage(chatId, { text }, { quoted: msg });

    try {
        if (msg?.key) {
            await sock.sendMessage(chatId, { react: { text: '🔗', key: msg.key } });
        }

        const response = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  💀  *𝙈𝘼𝙍𝘿𝘼𝙍𝘼 𝙐𝘾𝙃𝙄𝙃𝘼 — 𝙍𝙀𝙋𝙊𝙎𝙄𝙏𝙊𝙍𝙔*  💀  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  🔗 *GitHub Repository*                ┃
┃  ➤ ${REPOSITORY_URL}                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  📱 *Pairing Guide*                     ┃
┃  ➤ Type .pair 92XXXXXXXXXX              ┃
┃  ➤ Scan QR or enter the code in WhatsApp┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  🚀 *Quick Connect*                     ┃
┃  ✨ .pair 923XXXXXXXXX                  ┃
┃  ⚡ Scan • Pair • Enjoy                  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  👑 *Version*   : ${settings.version || '2.0.5'}       ┃
┃  🔐 *Security*  : Premium Encrypted     ┃
┃  ☠️ *POWERED BY* : ⚔️ BALI GIL MD ⚔️     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await sendMsg(response);
    } catch (error) {
        console.error('❌ Repo command error:', error);
        await sendMsg('⚠️ Something went wrong. Please try again.');
    }
};
