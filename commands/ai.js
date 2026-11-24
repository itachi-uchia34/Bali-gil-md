async function aiCommand(sock, from, msg, isAdmin, session, args) {
    if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only owner can use this command." }, { quoted: msg });
    
    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        if (!String(process.env.OPENAI_API_KEY || '').trim()) {
            return await sock.sendMessage(from, { text: '❌ Set OPENAI_API_KEY in your deployment secrets and restart the bot before enabling AI Auto-Reply.' }, { quoted: msg });
        }
        session.aiEnabled = true;
        await sock.sendMessage(from, { text: "✅ AI Auto-Reply Enabled!" }, { quoted: msg });
    } else if (action === 'off') {
        session.aiEnabled = false;
        await sock.sendMessage(from, { text: "❌ AI Auto-Reply Disabled!" }, { quoted: msg });
    } else if (args.length > 0) {
        // Direct query to AI
        const query = args.join(' ');
        try {
            await sock.sendMessage(from, { react: { text: '🤖', key: msg.key } });
            const response = await session.getAIResponse(from, query);
            await sock.sendMessage(from, { text: response }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ AI Error: " + e.message }, { quoted: msg });
        }
    } else {
        await sock.sendMessage(from, { text: "❌ Usage:\n.ai [on/off] - Toggle Auto-Reply\n.ai [query] - Ask AI something" }, { quoted: msg });
    }
}

module.exports = aiCommand;
