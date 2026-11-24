async function tagallCommand(sock, from, msg, isAdmin, q) {
    if (!isAdmin || !from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ Only group admins can use this command.' }, { quoted: msg });
    }

    try {
        const groupMetadata = await sock.groupMetadata(from);
        const participants = Array.isArray(groupMetadata.participants) ? groupMetadata.participants : [];
        const groupName = groupMetadata.subject || 'The Shinobi Realm';
        const announcement = (q || '').trim() || 'The realm has been summoned. Please gather your attention.';
        const mentions = participants.map(member => member.id || member.jid).filter(Boolean);
        const memberLines = mentions.map((jid, index) => `${String(index + 1).padStart(2, '0')}. @${jid.split('@')[0]}`);
        const header = [
            '╔═════════════════════════╗',
            '    👁️‍🗨️  𝗠𝗔𝗗𝗔𝗥𝗔  𝗨𝗖𝗛𝗜𝗛𝗔  👁️‍🗨️',
            '╚═════════════════════════╝',
            '',
            '⚔️ *SHINOBI SUMMONING*',
            `🏯 *Realm:* ${groupName}`,
            `👥 *Summoned:* ${mentions.length} shinobi`,
            '⛓️ *FINAL DECREE:*',
            `📜 *Announcement:* ${announcement}`,
            '',
            '━━━━━━━━━━━━━━━━━━━━━━━━━',
            '🩸 *THE SHINOBI ROSTER*',
            ''
        ].join('\n');
        const footer = [
            '',
            '━━━━━━━━━━━━━━━━━━━━━━━━━',
            '⚡ *POWERED BY ⚔️ BALI GIL MD ⚔️*'
        ].join('\n');

        const maxLength = 6000;
        const chunks = [];
        let current = header;
        for (const line of memberLines) {
            if ((current + line + '\n').length > maxLength) {
                chunks.push(current.trimEnd());
                current = '🩸 *CONTINUED SHINOBI ROSTER*\n\n';
            }
            current += `${line}\n`;
        }
        chunks.push(`${current.trimEnd()}${footer}`);

        for (let index = 0; index < chunks.length; index++) {
            await sock.sendMessage(from, { text: chunks[index], mentions }, { quoted: index === 0 ? msg : undefined });
        }
    } catch (error) {
        await sock.sendMessage(from, { text: `❌ Tagall failed: ${error.message}` }, { quoted: msg });
    }
}

module.exports = tagallCommand;
