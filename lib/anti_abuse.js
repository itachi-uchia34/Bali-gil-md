const crypto = require('crypto');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function isRateLimitError(error) {
  const text = String(error?.message || error || '').toLowerCase();
  return /429|rate.?limit|too many|spam|temporar|throttl|blocked|banned/.test(text);
}

function fingerprint(jid, payload) {
  const normalized = {
    jid,
    text: payload?.text || payload?.caption || '',
    type: payload?.react ? 'reaction' : payload?.image ? 'image' : payload?.video ? 'video' : payload?.audio ? 'audio' : 'text'
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

class AntiAbuseGuard {
  constructor() {
    this.enabled = String(process.env.ANTI_ABUSE_ENABLED || 'true').toLowerCase() !== 'false';
    this.minDelayMs = Math.max(150, Number(process.env.ANTI_ABUSE_MIN_DELAY_MS || 450));
    this.reactionDelayMs = Math.max(100, Number(process.env.ANTI_ABUSE_REACTION_DELAY_MS || 180));
    this.windowMs = Math.max(30000, Number(process.env.ANTI_ABUSE_WINDOW_MS || 60000));
    this.maxMessagesPerWindow = Math.max(20, Number(process.env.ANTI_ABUSE_MAX_MESSAGES || 80));
    this.maxBroadcastRecipients = Math.max(1, Number(process.env.ANTI_ABUSE_MAX_BROADCAST || 25));
    this.duplicateWindowMs = Math.max(5000, Number(process.env.ANTI_ABUSE_DUPLICATE_WINDOW_MS || 15000));
    this.pauseMs = Math.max(10000, Number(process.env.ANTI_ABUSE_PAUSE_MS || 60000));
    this.sentAt = [];
    this.recent = new Map();
    this.lastSendAt = 0;
    this.pausedUntil = 0;
    this.totalSent = 0;
    this.blocked = 0;
    this.lastBlockReason = null;
  }

  cleanup(now = Date.now()) {
    this.sentAt = this.sentAt.filter(timestamp => now - timestamp < this.windowMs);
    for (const [key, timestamp] of this.recent) {
      if (now - timestamp >= this.duplicateWindowMs) this.recent.delete(key);
    }
  }

  status() {
    this.cleanup();
    return {
      enabled: this.enabled,
      paused: this.pausedUntil > Date.now(),
      pausedUntil: this.pausedUntil || null,
      sentInWindow: this.sentAt.length,
      maxMessagesPerWindow: this.maxMessagesPerWindow,
      maxBroadcastRecipients: this.maxBroadcastRecipients,
      minDelayMs: this.minDelayMs,
      blocked: this.blocked,
      lastBlockReason: this.lastBlockReason
    };
  }

  assertBroadcastAllowed(count) {
    if (!Number.isInteger(count) || count < 1) throw new Error('Broadcast recipient count is invalid.');
    if (!this.enabled) return true;
    if (count > this.maxBroadcastRecipients) {
      this.blocked++;
      this.lastBlockReason = `broadcast cap ${count}/${this.maxBroadcastRecipients}`;
      throw new Error(`Safety limit: broadcast capped at ${this.maxBroadcastRecipients} recipients. Split the broadcast into smaller approved batches.`);
    }
    return true;
  }

  async sendMessage(rawSend, jid, payload, options = {}, policy = {}) {
    const now = Date.now();
    this.cleanup(now);
    if (!this.enabled) return rawSend(jid, payload, options);
    if (this.pausedUntil > now) {
      this.blocked++;
      this.lastBlockReason = 'circuit breaker paused';
      throw new Error('Anti-abuse safety pause is active. Please wait before sending again.');
    }
    if (this.sentAt.length >= this.maxMessagesPerWindow) {
      this.pausedUntil = now + this.pauseMs;
      this.blocked++;
      this.lastBlockReason = 'message-rate limit';
      throw new Error('Anti-abuse safety pause activated after too many outgoing messages.');
    }

    const key = fingerprint(jid, payload);
    const previous = this.recent.get(key);
    if (previous && now - previous < this.duplicateWindowMs && !policy.allowDuplicate) {
      this.blocked++;
      this.lastBlockReason = 'duplicate suppression';
      throw new Error('Duplicate outgoing message suppressed by anti-abuse protection.');
    }

    const delayMs = Math.max(0, Number(policy.delayMs || (payload?.react ? this.reactionDelayMs : this.minDelayMs)));
    const waitMs = Math.max(0, this.lastSendAt + delayMs - now);
    if (waitMs) await sleep(waitMs);

    try {
      const result = await rawSend(jid, payload, options);
      const sentAt = Date.now();
      this.lastSendAt = sentAt;
      this.sentAt.push(sentAt);
      this.recent.set(key, sentAt);
      this.totalSent++;
      return result;
    } catch (error) {
      if (isRateLimitError(error)) {
        this.pausedUntil = Date.now() + this.pauseMs;
        this.lastBlockReason = `provider warning: ${error.message}`;
      }
      throw error;
    }
  }
}

function applyAntiAbuse(sock) {
  if (!sock || sock.__antiAbuseGuard) return sock?.antiAbuse;
  const guard = new AntiAbuseGuard();
  const rawSend = sock.sendMessage.bind(sock);
  sock.antiAbuse = guard;
  sock.safeSendMessage = (jid, payload, options, policy) => guard.sendMessage(rawSend, jid, payload, options, policy);
  sock.sendMessage = (jid, payload, options) => guard.sendMessage(rawSend, jid, payload, options);
  Object.defineProperty(sock, '__antiAbuseGuard', { value: true, enumerable: false });
  return guard;
}

module.exports = { AntiAbuseGuard, applyAntiAbuse, isRateLimitError };
