function isGroup(from) {
    return from.endsWith('@g.us');
}

function deny(sock, from, msg, text = '❌ This command is only available in groups.') {
    return sock.sendMessage(from, { text }, { quoted: msg });
}

async function getMetadata(sock, from, msg) {
    if (!isGroup(from)) {
        await deny(sock, from, msg);
        return null;
    }
    try {
        return await sock.groupMetadata(from);
    } catch (error) {
        await sock.sendMessage(from, { text: `❌ Could not read group information: ${error.message}` }, { quoted: msg });
        return null;
    }
}

function jid(member) {
    return member.id || member.jid;
}

async function admins(sock, from, msg) {
    const metadata = await getMetadata(sock, from, msg);
    if (!metadata) return;
    const list = metadata.participants.filter(member => member.admin).map((member, index) => `${index + 1}. @${jid(member).split('@')[0]}`);
    return sock.sendMessage(from, { text: `⚔️ *GROUP ADMINS*\n\n🏯 *${metadata.subject || 'Shinobi Realm'}*\n👑 Admins: ${list.length}\n\n${list.join('\n') || 'No admins found.'}`, mentions: metadata.participants.filter(member => member.admin).map(jid) }, { quoted: msg });
}

async function members(sock, from, msg) {
    const metadata = await getMetadata(sock, from, msg);
    if (!metadata) return;
    const ids = metadata.participants.map(jid);
    const list = ids.map((id, index) => `${String(index + 1).padStart(2, '0')}. @${id.split('@')[0]}`);
    return sock.sendMessage(from, { text: `👥 *GROUP MEMBERS*\n\n🏯 *${metadata.subject || 'Shinobi Realm'}*\n👤 Members: ${ids.length}\n\n${list.join('\n')}`, mentions: ids }, { quoted: msg });
}

async function groupstats(sock, from, msg) {
    const metadata = await getMetadata(sock, from, msg);
    if (!metadata) return;
    const adminsCount = metadata.participants.filter(member => member.admin).length;
    return sock.sendMessage(from, { text: `📊 *GROUP STATISTICS*\n\n🏯 Name: ${metadata.subject || 'Shinobi Realm'}\n👥 Total members: ${metadata.participants.length}\n👑 Admins: ${adminsCount}\n🥷 Regular members: ${metadata.participants.length - adminsCount}\n🆔 Group ID: ${from}` }, { quoted: msg });
}

async function groupname(sock, from, msg, isAdmin, q) {
    if (!isGroup(from)) return deny(sock, from, msg);
    if (!isAdmin) return deny(sock, from, msg, '❌ Only group admins can change the group name.');
    const name = (q || '').trim();
    if (!name) return deny(sock, from, msg, 'Usage: .groupname <new group name>');
    try {
        await sock.groupUpdateSubject(from, name.slice(0, 100));
        return sock.sendMessage(from, { text: `✅ Group name changed to *${name.slice(0, 100)}*.` }, { quoted: msg });
    } catch (error) {
        return sock.sendMessage(from, { text: `❌ Could not change the group name: ${error.message}` }, { quoted: msg });
    }
}

async function poll(sock, from, msg, isAdmin, q) {
    if (!isGroup(from)) return deny(sock, from, msg);
    if (!isAdmin) return deny(sock, from, msg, '❌ Only group admins can create official polls.');
    const parts = (q || '').split('|').map(part => part.trim()).filter(Boolean);
    if (parts.length < 3) return deny(sock, from, msg, 'Usage: .poll Question | Option 1 | Option 2');
    const [name, ...values] = parts;
    if (values.length > 12) return deny(sock, from, msg, '❌ A poll can have up to 12 options.');
    return sock.sendMessage(from, { poll: { name: `⚔️ ${name}`, values, selectableCount: 1 } }, { quoted: msg });
}

async function setdesc(sock, from, msg, isAdmin, q) {
    if (!isGroup(from)) return deny(sock, from, msg);
    if (!isAdmin) return deny(sock, from, msg, '❌ Only group admins can change the group description.');
    const description = (q || '').trim();
    if (!description) return deny(sock, from, msg, 'Usage: .setdesc <new group description>');
    try {
        await sock.groupUpdateDescription(from, description.slice(0, 2048));
        return sock.sendMessage(from, { text: '✅ Group description updated successfully.' }, { quoted: msg });
    } catch (error) {
        return sock.sendMessage(from, { text: `❌ Could not update the group description: ${error.message}` }, { quoted: msg });
    }
}

async function groupSetting(sock, from, msg, isAdmin, setting, label) {
    if (!isGroup(from)) return deny(sock, from, msg);
    if (!isAdmin) return deny(sock, from, msg, '❌ Only group admins can change group permissions.');
    try {
        await sock.groupSettingUpdate(from, setting);
        return sock.sendMessage(from, { text: `✅ Group mode changed: *${label}*.` }, { quoted: msg });
    } catch (error) {
        return sock.sendMessage(from, { text: `❌ Could not change group mode: ${error.message}` }, { quoted: msg });
    }
}

const groupclose = (sock, from, msg, isAdmin) => groupSetting(sock, from, msg, isAdmin, 'announcement', 'admins can send messages');
const groupopen = (sock, from, msg, isAdmin) => groupSetting(sock, from, msg, isAdmin, 'not_announcement', 'all members can send messages');
const adminsonly = (sock, from, msg, isAdmin) => groupSetting(sock, from, msg, isAdmin, 'locked', 'only admins can edit group info');
const allmembers = (sock, from, msg, isAdmin) => groupSetting(sock, from, msg, isAdmin, 'unlocked', 'all members can edit group info');

async function grouplink(sock, from, msg, isAdmin) {
    if (!isGroup(from)) return deny(sock, from, msg);
    if (!isAdmin) return deny(sock, from, msg, '❌ Only group admins can request the invite link.');
    try {
        const code = await sock.groupInviteCode(from);
        return sock.sendMessage(from, { text: `🔗 *GROUP INVITE LINK*\n\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
    } catch (error) {
        return sock.sendMessage(from, { text: `❌ Could not get the group link: ${error.message}` }, { quoted: msg });
    }
}

async function revokeinvite(sock, from, msg, isAdmin) {
    if (!isGroup(from)) return deny(sock, from, msg);
    if (!isAdmin) return deny(sock, from, msg, '❌ Only group admins can revoke the invite link.');
    try {
        await sock.groupRevokeInvite(from);
        return sock.sendMessage(from, { text: '✅ The old invite link was revoked. A new link is now required.' }, { quoted: msg });
    } catch (error) {
        return sock.sendMessage(from, { text: `❌ Could not revoke the group link: ${error.message}` }, { quoted: msg });
    }
}

async function grouphelp(sock, from, msg) {
    return sock.sendMessage(from, { text: '*GROUP COMMANDS*\n\n.admins — list group admins\n.members — list all members\n.groupstats — show group statistics\n.groupname <name> — change group name\n.setdesc <text> — change group description\n.groupopen — allow all members to send messages\n.groupclose — admins-only messages\n.adminsonly — admins-only group info edits\n.allmembers — allow members to edit group info\n.grouplink — get invite link\n.revokeinvite — revoke invite link\n.poll Question | Option 1 | Option 2 — create a poll\n.tagall <message> — mention everyone\n.hidetag <message> — mention everyone silently' }, { quoted: msg });
}

module.exports = { admins, members, groupstats, groupname, setdesc, groupopen, groupclose, adminsonly, allmembers, grouplink, revokeinvite, poll, grouphelp };
