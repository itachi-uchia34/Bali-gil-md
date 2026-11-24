const { performance } = require('node:perf_hooks');

async function pingCommand(sock, from, msg) {
    const startedAt = performance.now();
    const initial = await sock.sendMessage(from, { text: '🏓 Measuring bot response latency…' }, { quoted: msg });
    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));
    const resultText = `🏓 *PONG*\n⚡ *Response latency:* ${latencyMs} ms`;

    if (initial?.key) {
        try {
            return await sock.sendMessage(from, { text: resultText, edit: initial.key });
        } catch (error) {
            // Editing is not supported by every compatible socket; send a normal reply instead.
        }
    }

    return sock.sendMessage(from, { text: resultText }, { quoted: msg });
}

module.exports = pingCommand;
