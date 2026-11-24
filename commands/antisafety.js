function formatStatus(status) {
  return [
    '🛡️ *BALI GIL ANTI-ABUSE MODE*',
    '',
    `Status: *${status.enabled ? 'ON' : 'OFF'}*`,
    `Circuit breaker: *${status.paused ? 'PAUSED' : 'READY'}*`,
    `Messages in window: *${status.sentInWindow}/${status.maxMessagesPerWindow}*`,
    `Broadcast cap: *${status.maxBroadcastRecipients} recipients*`,
    `Minimum delay: *${status.minDelayMs} ms*`,
    `Blocked actions: *${status.blocked}*`,
    '',
    '> This reduces spam-like behavior but cannot override WhatsApp enforcement.'
  ].join('\n');
}

async function safetymode(sock, from, msg, isOwner, q, session) {
  if (!isOwner) return sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg });
  const guard = sock.antiAbuse || session?.sock?.antiAbuse;
  if (!guard) return sock.sendMessage(from, { text: '⚠️ Anti-abuse guard is not ready yet. Reconnect the session and try again.' }, { quoted: msg });

  const action = String(q || 'status').trim().toLowerCase();
  if (action === 'on') {
    guard.enabled = true;
    return sock.sendMessage(from, { text: `${formatStatus(guard.status())}\n\n✅ Safety mode enabled.` }, { quoted: msg });
  }
  if (action === 'off') {
    guard.enabled = false;
    return sock.sendMessage(from, { text: `${formatStatus(guard.status())}\n\n⚠️ Safety mode disabled by owner. Re-enable it with *.safetymode on*.` }, { quoted: msg });
  }
  if (action !== 'status') {
    return sock.sendMessage(from, { text: '⚠️ Use `.safetymode status`, `.safetymode on`, or `.safetymode off`.' }, { quoted: msg });
  }
  return sock.sendMessage(from, { text: formatStatus(guard.status()) }, { quoted: msg });
}

module.exports = { safetymode };
