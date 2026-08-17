require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
let TelegramBot;
let baileysModule;
let pinoFactory;

function getBaileys() {
  if (!baileysModule) baileysModule = require('@whiskeysockets/baileys');
  return baileysModule;
}

function getPino() {
  if (!pinoFactory) pinoFactory = require('pino');
  return pinoFactory;
}

// Load settings (provide fallback if missing)
let settings = {};
try {
  settings = require('./settings');
} catch {
  settings = {
    startimage: 'https://example.com/default.jpg',
    tgOwnerId: process.env.OWNER_TELEGRAM_ID || '',
    premiumUsers: [],
  };
}

// =================== SERVER SETUP ===================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Never let one bad async error take down the whole process (and with it,
// any in-progress WhatsApp pairing). Log it and keep running instead.
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (ignored, process kept alive):', err?.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (ignored, process kept alive):', reason);
});

// =================== TELEGRAM BOT ===================
const tgToken = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
let tgBot = null;
if (tgToken) {
  TelegramBot = require('node-telegram-bot-api');
  tgBot = new TelegramBot(tgToken, {
    polling: { interval: 3000, autoStart: true, params: { timeout: 10 } },
  });
  tgBot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.message);
    if (error.message.includes('409') || error.message.includes('Conflict')) {
      console.error('Telegram polling conflict: stop every other bot instance, then restart this one.');
      tgBot.stopPolling();
    }
  });
} else {
  console.warn('TELEGRAM_BOT_TOKEN is missing – Telegram commands are disabled. Set it in the deployment environment.');
}

// =================== SESSION MANAGEMENT ===================
const sessions = {};
const botData = { statusSettings: {} };
const BOT_DATA_PATH = path.join(__dirname, 'botData.json');

function saveBotData() {
  try {
    fs.writeJsonSync(BOT_DATA_PATH, botData, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save bot data (ignored):', err.message);
  }
}

function loadBotData() {
  if (fs.existsSync(BOT_DATA_PATH)) {
    try {
      const data = fs.readJsonSync(BOT_DATA_PATH);
      Object.assign(botData, data);
    } catch {}
  }
}
loadBotData();

// =================== BOT SESSION CLASS ===================
class BotSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.sock = null;
    this.phoneNumber = null;
    this.isConnected = false;
    this.isInitializing = false;
    this.pairingCode = null;
    this.pairingExpiresAt = null;
    this.pairingRequested = false;
    this.pairingRetryCount = 0;
    this.suppressNextCloseError = false;
    this.tgChatId = null;
    this.lastRequestAt = 0;
    this.expiryTimer = null;
  }

  // Fully tears down any previous socket/timers/pairing state for this
  // session so a fresh "Get Code" click always starts clean, instead of
  // inheriting stale flags (like pairingRequested) from a prior attempt.
  async reset() {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    if (this.sock) {
      try { this.sock.ev.removeAllListeners(); } catch {}
      try { this.sock.end?.(new Error('Restarting pairing session')); } catch {}
      try { this.sock.ws?.close(); } catch {}
      this.sock = null;
    }
    this.isInitializing = false;
    this.isConnected = false;
    this.pairingRequested = false;
    this.pairingCode = null;
    this.pairingExpiresAt = null;
    this.pairingRetryCount = 0;
    this.suppressNextCloseError = false;
  }

  async initialize(number) {
    if (this.isInitializing) return;
    this.isInitializing = true;
    this.phoneNumber = number;

    const authFolder = `auth_info_${this.sessionId}`;
    const baileys = getBaileys();
    const { state, saveCreds } = await baileys.useMultiFileAuthState(authFolder);
    const { version } = await baileys.fetchLatestBaileysVersion();

    this.sock = baileys.default({
      version,
      auth: state,
      browser: baileys.Browsers.windows('Chrome'),
      markOnlineOnConnect: false,
      connectTimeoutMs: 60000,
      logger: getPino()({ level: 'silent' }),
      getMessage: async () => ({}),
    });

    // Pairing codes must be requested after Baileys emits a QR update.
    // Calling requestPairingCode immediately can produce status 428.
    io.emit('pairing-status', { state: 'connecting', message: 'Opening the WhatsApp secure channel…' });
    this.sock.ev.on('creds.update', saveCreds);
    let pairingTimer = null;
    const requestPairingCode = async () => {
      if (!number || this.pairingCode || this.pairingRequested || state.creds.registered) return;
      this.pairingRequested = true;
      pairingTimer = null;
      io.emit('pairing-status', { state: 'requesting', message: 'Requesting a temporary pairing code…' });
      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        if (!this.sock || state.creds.registered) return;
        const code = await this.sock.requestPairingCode(number);
        this.pairingCode = code;
        this.pairingExpiresAt = Date.now() + 60000;
        this.isInitializing = false;
        io.emit('pairing-status', { state: 'code-ready', message: 'Pairing code ready. Enter it in WhatsApp.' });
        io.emit('pairing-code', { code, expiresAt: this.pairingExpiresAt });
        if (this.expiryTimer) clearTimeout(this.expiryTimer);
        this.expiryTimer = setTimeout(() => {
          if (this.pairingCode === code) {
            this.pairingCode = null;
            this.pairingExpiresAt = null;
            this.pairingRequested = false;
            io.emit('pairing-status', { state: 'error', message: 'The pairing code expired. Request a new one.' });
          }
        }, 60000);
        if (this.tgChatId && tgBot) {
          try {
            await this.sendPairingCodeToTelegram(this.tgChatId, code);
          } catch (telegramError) {
            console.error('Pairing code was generated, but Telegram delivery failed:', telegramError.message);
          }
        }
      } catch (err) {
        const statusCode = err?.output?.statusCode || err?.statusCode;
        this.pairingRequested = false;
        this.pairingCode = null;
        this.isInitializing = false;
        console.error('Pairing request failed:', err.message);

        if (statusCode === 428 && !state.creds.registered && this.pairingRetryCount < 3) {
          this.pairingRetryCount += 1;
          this.suppressNextCloseError = true;
          try { this.sock?.ws?.close(); } catch {}
          this.sock = null;
          try { await fs.remove(authFolder); } catch {}
          const retryIn = this.pairingRetryCount * 2500;
          io.emit('pairing-status', { state: 'retrying', message: `WhatsApp closed the pairing channel. Retrying (${this.pairingRetryCount}/3) in ${Math.ceil(retryIn / 1000)} seconds…` });
          setTimeout(() => { void this.initialize(number).catch((retryError) => console.error('WhatsApp pairing retry failed:', retryError.message)); }, retryIn);
          return;
        }

        const message = statusCode === 428
          ? 'WhatsApp closed the pairing channel after several retries. Start a new request and ensure this number is not already linked on another session.'
          : `Pairing request failed: ${err.message}`;
        io.emit('pairing-status', { state: 'error', message });
        io.emit('pair-error', message);
      }
    };

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr && number && !state.creds.registered && !this.pairingRequested && !pairingTimer) {
        io.emit('pairing-status', { state: 'waiting', message: 'WhatsApp is ready. Preparing your pairing code…' });
        pairingTimer = setTimeout(() => { void requestPairingCode(); }, 100);
      }
      if (connection === 'close') {
        if (pairingTimer) clearTimeout(pairingTimer);
        pairingTimer = null;
        this.isConnected = false;
        this.sock = null;
        this.pairingRequested = false;
        this.isInitializing = false;
        io.emit('connection-status', { connected: false });
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const suppressCloseError = this.suppressNextCloseError;
        this.suppressNextCloseError = false;
        const DisconnectReason = getBaileys().DisconnectReason;

        // 515 (restartRequired) always follows a successful pairing-code
        // registration — WhatsApp intentionally closes the socket once and
        // expects an immediate reconnect using the now-saved credentials to
        // finish linking. Without this, the phone hangs on "Logging in…"
        // forever waiting for a handshake that never resumes.
        if (statusCode === DisconnectReason.restartRequired) {
          io.emit('pairing-status', { state: 'linking', message: 'Code accepted — finishing the link…' });
          setTimeout(() => {
            void this.initialize(number).catch((e) => console.error('Reconnect after pairing failed:', e.message));
          }, 500);
          return;
        }

        // Any other transient close that happens after the account is
        // already registered (pairing succeeded, connection just dropped)
        // should reconnect quietly instead of forcing a brand-new code.
        if (statusCode !== DisconnectReason.loggedOut && state.creds.registered && this.pairingRetryCount < 5) {
          this.pairingRetryCount += 1;
          const retryIn = 2000;
          setTimeout(() => {
            void this.initialize(number).catch((e) => console.error('Reconnect failed:', e.message));
          }, retryIn);
          return;
        }

        // A 401 (loggedOut) before pairing ever completed means the local
        // auth_info folder is stale/invalid, not that the user was really
        // logged out. Wipe it and retry automatically, same as the 428 path.
        if (
          statusCode === getBaileys().DisconnectReason.loggedOut &&
          !state.creds.registered &&
          this.pairingRetryCount < 3
        ) {
          this.pairingRetryCount += 1;
          const retryIn = this.pairingRetryCount * 2000;
          io.emit('pairing-status', { state: 'retrying', message: `Clearing an invalid session and retrying (${this.pairingRetryCount}/3) in ${Math.ceil(retryIn / 1000)} seconds…` });
          fs.remove(authFolder).catch(() => {}).finally(() => {
            setTimeout(() => { void this.initialize(number).catch((retryError) => console.error('WhatsApp pairing retry failed:', retryError.message)); }, retryIn);
          });
          return;
        }

        if (!suppressCloseError) io.emit('pairing-status', { state: 'error', message: `WhatsApp connection closed${statusCode ? ` (status ${statusCode})` : ''}. Retry the request.` });
        if (statusCode !== getBaileys().DisconnectReason.loggedOut) {
          console.warn(`WhatsApp connection closed (status ${statusCode || 'unknown'}); retry the pairing request.`);
        }
      } else if (connection === 'open') {
        this.isConnected = true;
        this.pairingRetryCount = 0;
        this.phoneNumber = this.sock?.user?.id?.split('@')[0] || this.phoneNumber;
        this.isInitializing = Boolean(number && !state.creds.registered && !this.pairingCode);
        io.emit('connection-status', { connected: true });
        io.emit('pairing-status', { state: 'connected', message: 'WhatsApp connected successfully.' });
        if (!botData.statusSettings[this.sessionId]) {
          botData.statusSettings[this.sessionId] = { isPublic: true };
          saveBotData();
        }
      }
    });

    // The socket is now listening for its QR/connection updates; the code is
    // delivered asynchronously when the QR update arrives.
    return true;
  }

  async sendPairingCodeToTelegram(chatId, code) {
    if (!tgBot || !chatId || !code) return;
    const rawCode = String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const htmlEscape = (value) => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
    const msg =
      '<b>PAIRING CODE READY</b>\n\n' +
      `<code>${htmlEscape(rawCode)}</code>\n\n` +
      'Open WhatsApp → Settings → Linked Devices → Link with phone number, then enter the 8 characters exactly as shown.\n' +
      'Do not type spaces or a hyphen. The code is temporary; keep this chat open until the device is linked.\n\n' +
      '<i>POWERED BY ITACHI-UCHIHA</i>';
    try {
      await tgBot.sendMessage(chatId, msg, { parse_mode: 'HTML', disable_web_page_preview: true });
    } catch (error) {
      console.error('Telegram pairing-code delivery failed:', error.message);
      await tgBot.sendMessage(chatId, `PAIRING CODE READY\n\n${rawCode}\n\nEnter this code in WhatsApp → Settings → Linked Devices → Link with phone number.`);
    }
  }

  sendConnectionStatus() {
    io.emit('connection-status', {
      connected: this.isConnected,
      pairingCode: this.pairingCode,
      pairingExpiresAt: this.pairingExpiresAt,
    });
  }
}

// =================== HELPER FUNCTIONS ===================
function normalizeWhatsAppNumber(rawNumber) {
  const digits = String(rawNumber || '').replace(/\D/g, '');
  return digits.startsWith('00') ? digits.slice(2) : digits;
}

function isValidWhatsAppNumber(cleanNumber) {
  return /^[1-9]\d{9,14}$/.test(cleanNumber);
}

function sessionIdForNumber(cleanNumber) {
  return `wa_${cleanNumber}`;
}

function getSessionForNumber(cleanNumber) {
  const canonicalId = sessionIdForNumber(cleanNumber);
  if (sessions[canonicalId]) {
    return { session: sessions[canonicalId], sessionId: canonicalId };
  }
  for (const [sid, sess] of Object.entries(sessions)) {
    if (sess.phoneNumber === cleanNumber) {
      return { session: sess, sessionId: sid };
    }
  }
  const newSession = new BotSession(canonicalId);
  sessions[canonicalId] = newSession;
  return { session: newSession, sessionId: canonicalId };
}

function normalizeTelegramUsername(username) {
  return String(username || '').trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');
}

function publicDeploymentUrl() {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${domain}`;
  }
  return '';
}

let telegramBotLink = '';
async function resolveTelegramBotLink() {
  if (!tgBot) {
    telegramBotLink = '';
    return '';
  }
  const configuredUsername = normalizeTelegramUsername(process.env.TELEGRAM_BOT_USERNAME);
  if (configuredUsername) {
    telegramBotLink = `https://t.me/${configuredUsername}`;
    return telegramBotLink;
  }
  try {
    const botInfo = await tgBot.getMe();
    const username = normalizeTelegramUsername(botInfo?.username);
    telegramBotLink = username ? `https://t.me/${username}` : '';
  } catch (error) {
    console.warn('[Telegram] Unable to resolve bot link:', error.message);
  }
  return telegramBotLink;
}
resolveTelegramBotLink();

function isTgOwner(chatId) {
  const ownerChatId = process.env.OWNER_TELEGRAM_ID || settings.tgOwnerId;
  return chatId.toString() === ownerChatId;
}

// =================== CLEAR SESSION ===================
async function clearSession(cleanNumber) {
  const sessionId = sessionIdForNumber(cleanNumber);
  const authFolder = `auth_info_${sessionId}`;
  // Remove from memory
  if (sessions[sessionId]) {
    delete sessions[sessionId];
  }
  for (const [sid, sess] of Object.entries(sessions)) {
    if (sess.phoneNumber === cleanNumber) {
      delete sessions[sid];
    }
  }
  // Delete auth folder
  try {
    await fs.remove(authFolder);
  } catch {}
  // Remove from botData
  if (botData.statusSettings[sessionId]) {
    delete botData.statusSettings[sessionId];
    saveBotData();
  }
  return true;
}

// =================== SOCKET.IO EVENTS ===================
io.on('connection', (socket) => {
  console.log('New client connected');
  const activeSockets = Object.values(sessions).filter(s => s.isConnected).length;
  const totalUsers = Object.keys(sessions).length;
  socket.emit('stats', { activeSockets, totalUsers });

  socket.on('pair-request', async ({ number }) => {
    try {
      const cleanNumber = normalizeWhatsAppNumber(number);
      if (!isValidWhatsAppNumber(cleanNumber)) {
        socket.emit('pair-error', 'Invalid number. Provide a complete WhatsApp number with country code, e.g., 923271054080.');
        return;
      }
      const { session } = getSessionForNumber(cleanNumber);
      if (session.isConnected) {
        socket.emit('pairing-status', { state: 'connected', message: 'This WhatsApp number is already connected.' });
        socket.emit('pair-error', `This number (${cleanNumber}) is already connected.`);
        return;
      }
      const now = Date.now();
      if (now - session.lastRequestAt < 8000) {
        socket.emit('pairing-status', { state: 'connecting', message: 'Please wait a few seconds before requesting another code.' });
        return;
      }
      session.lastRequestAt = now;

      // Always start from a clean slate instead of trusting leftover state
      // from a previous attempt (this is what caused "stuck" pairing).
      await session.reset();

      socket.emit('pairing-status', { state: 'connecting', message: 'Opening the WhatsApp secure channel…' });
      await session.initialize(cleanNumber);
    } catch (error) {
      const message = error?.message || 'Unknown WhatsApp pairing error';
      socket.emit('pairing-status', { state: 'error', message: `Failed to start pairing: ${message}` });
      socket.emit('pair-error', `Failed to start pairing: ${message}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// =================== API ROUTES ===================
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    telegramConfigured: Boolean(tgBot),
    activeSessions: Object.values(sessions).filter((session) => session.isConnected).length,
  });
});

app.get('/api/runtime-config', async (req, res) => {
  const botLink = await resolveTelegramBotLink();
  const publicUrl = publicDeploymentUrl();
  res.json({
    telegramConfigured: Boolean(tgBot),
    telegramBotLink: botLink || '',
    publicDeploymentUrl: publicUrl || '',
  });
});

app.post('/api/clear-session', async (req, res) => {
  const { number } = req.body;
  if (!number) {
    return res.status(400).json({ error: 'Number is required' });
  }
  const cleanNumber = normalizeWhatsAppNumber(number);
  if (!isValidWhatsAppNumber(cleanNumber)) {
    return res.status(400).json({ error: 'Invalid number format' });
  }
  await clearSession(cleanNumber);
  res.json({ success: true, message: `Session for ${cleanNumber} cleared` });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =================== TELEGRAM COMMANDS ===================
if (tgBot) {
  tgBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const isOwner = isTgOwner(chatId);
    const welcomeMessage =
      `╭━━〔 *BALI GIL MINI BOT* 〕━━╮\n` +
      `┃  WhatsApp connection center\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `*Available actions*\n` +
      `• /connect <number> — request a pairing code\n` +
      `• /link <number> — alias for /connect\n` +
      `• /deploy — show website and bot links\n` +
      `• /clearsession <number> — remove session\n` +
      `• Send a number directly — quick connect\n` +
      `${isOwner ? `• /status — view connected sessions\n` : ''}\n` +
      `*Connection steps*\n` +
      `1. Use your full WhatsApp number with country code.\n` +
      `2. Example: \`923271054080\`\n` +
      `3. Open WhatsApp → Linked Devices → Link a Device.\n` +
      `4. Enter the code sent here.\n\n` +
      `> The pairing code is temporary. Keep this chat open while connecting.\n` +
      `> POWERED BY ITACHI-UCHIHA`;
    try {
      await tgBot.sendPhoto(chatId, settings.startimage, { caption: welcomeMessage, parse_mode: 'Markdown' });
    } catch {
      await tgBot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    }
  });

  tgBot.onText(/\/(?:connect|link)(?:\s+(.+))?/, async (msg, match) => {
    const rawNumber = match && match[1] ? match[1] : '';
    if (!rawNumber.trim()) {
      await tgBot.sendMessage(msg.chat.id, 'Usage: /connect 923271054080\nUse the complete number with country code and without the plus sign.', { parse_mode: 'Markdown' });
      return;
    }
    await startTelegramPairing(msg.chat.id, rawNumber);
  });

  tgBot.onText(/\/clearsession(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const rawNumber = match && match[1] ? match[1] : '';
    if (!rawNumber.trim()) {
      await tgBot.sendMessage(chatId, 'Usage: /clearsession 923271054080\nProvide the WhatsApp number to remove its session.', { parse_mode: 'Markdown' });
      return;
    }
    const cleanNumber = normalizeWhatsAppNumber(rawNumber);
    if (!isValidWhatsAppNumber(cleanNumber)) {
      await tgBot.sendMessage(chatId, 'Invalid number format.', { parse_mode: 'Markdown' });
      return;
    }
    await clearSession(cleanNumber);
    await tgBot.sendMessage(chatId, `✅ Session for \`${cleanNumber}\` has been cleared.`, { parse_mode: 'Markdown' });
  });

  tgBot.onText(/\/deploy/, async (msg) => {
    const botLink = await resolveTelegramBotLink();
    const website = publicDeploymentUrl();
    const message =
      `*BALI GIL DEPLOYMENT CENTER*\n\n` +
      (website ? `Live website: ${website}\n` : 'Live website: not configured\n') +
      (botLink ? `Telegram bot: ${botLink}\n\n` : '\n') +
      `To connect a WhatsApp number, send /connect <number> or use the UI on the website if available.`;
    await tgBot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
  });

  // Quick connect: direct number message
  tgBot.onText(/^(\d{10,15})$/, async (msg, match) => {
    const number = match[1];
    await startTelegramPairing(msg.chat.id, number);
  });
}

async function startTelegramPairing(chatId, rawNumber) {
  if (!tgBot) {
    console.error('Telegram pairing requested while TELEGRAM_BOT_TOKEN is not configured.');
    return;
  }
  const cleanNumber = normalizeWhatsAppNumber(rawNumber);
  if (!isValidWhatsAppNumber(cleanNumber)) {
    await tgBot.sendMessage(chatId, 'Invalid number. Send the complete WhatsApp number with country code, without a leading local 0. Example: `923271054080`.', { parse_mode: 'Markdown' });
    return;
  }

  const { session } = getSessionForNumber(cleanNumber);
  const sessionKey = session.sessionId;
  if (!botData.statusSettings[sessionKey]) {
    botData.statusSettings[sessionKey] = { isPublic: true };
    saveBotData();
  }

  if (session.isConnected) {
    await tgBot.sendMessage(chatId, `This WhatsApp number is already linked and online: \`${session.phoneNumber || cleanNumber}\`.`, { parse_mode: 'Markdown' });
    return;
  }

  if (session.isInitializing) {
    session.tgChatId = chatId;
    if (session.pairingCode && session.pairingExpiresAt && Date.now() < session.pairingExpiresAt) {
      await session.sendPairingCodeToTelegram(chatId, session.pairingCode);
    } else {
      await tgBot.sendMessage(chatId, 'A connection request is already running. The pairing code will be sent here as soon as it is ready.', { parse_mode: 'Markdown' });
    }
    return;
  }

  const initMsg =
    `PAIRING REQUEST\n\n` +
    `Number: ${cleanNumber}\n` +
    `Status: generating code...\n\n` +
    `Keep this chat open. The code will arrive here shortly.`;
  const now = Date.now();
  if (now - session.lastRequestAt < 8000) {
    await tgBot.sendMessage(chatId, 'Please wait a few seconds before requesting another code.');
    return;
  }
  session.lastRequestAt = now;
  await session.reset();

  await tgBot.sendMessage(chatId, initMsg);
  session.tgChatId = chatId;
  try {
    const initialized = await session.initialize(cleanNumber);
    if (initialized === false) {
      await tgBot.sendMessage(chatId, 'Pairing could not start because WhatsApp closed the connection before the code was ready. Please retry in a few seconds.', { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Telegram pairing handler failed:', error.message);
    await tgBot.sendMessage(chatId, 'Pairing could not start. Please retry in a few seconds.', { parse_mode: 'Markdown' });
  }
}

// =================== START SERVER ===================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to open the web UI.`);
});
