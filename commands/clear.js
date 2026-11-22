module.exports = async function(sock, chatId, msg) {
    await sock.sendMessage(chatId, {
        text: '\u26A0\uFE0F Bulk chat clearing is not supported. No messages were deleted. Use WhatsApp\u2019s message controls to remove a specific message.'
    }, { quoted: msg });
};
