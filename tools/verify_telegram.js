#!/usr/bin/env node
/*
 * Safe Telegram and pairing readiness check.
 *
 * Default mode is read-only: it calls Telegram getMe/getWebhookInfo and checks
 * the deployed website. It never prints the token and never consumes updates.
 * Use --send-test only when TELEGRAM_TEST_CHAT_ID is explicitly configured.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const token = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
const baseUrl = String(process.env.PUBLIC_URL || process.env.TEST_BASE_URL || 'http://localhost:3000')
  .trim()
  .replace(/\/$/, '');
const testChatId = String(process.env.TELEGRAM_TEST_CHAT_ID || '').trim();
const sendTest = process.argv.includes('--send-test');

function pass(label, detail = '') {
  console.log(`PASS  ${label}${detail ? ` — ${detail}` : ''}`);
}
function warn(label, detail = '') {
  console.log(`WARN  ${label}${detail ? ` — ${detail}` : ''}`);
}
function fail(label, detail = '') {
  console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
}
async function telegram(method, body = {}) {
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing');
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.description || `HTTP ${response.status}`);
  }
  return json.result;
}
async function httpGet(route) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: 'follow' });
  const text = await response.text();
  return { status: response.status, text };
}
async function main() {
  let failures = 0;
  console.log(`Checking Telegram and pairing readiness for ${baseUrl}`);
  console.log('Read-only mode: no Telegram updates are consumed.');

  if (!token || token.includes('REPLACE_WITH') || token.includes('PASTE_')) {
    fail('Telegram token', 'Set a real TELEGRAM_BOT_TOKEN in .env');
    failures += 1;
  } else {
    try {
      const me = await telegram('getMe');
      pass('Telegram token', `authenticated as @${me.username || me.first_name || 'unknown'}`);
    } catch (error) {
      fail('Telegram token', error.message);
      failures += 1;
    }

    try {
      const webhook = await telegram('getWebhookInfo');
      if (webhook.url) {
        warn('Telegram delivery mode', `webhook configured at ${webhook.url}`);
        if (webhook.last_error_message) {
          fail('Telegram webhook', `${webhook.last_error_message} (${webhook.last_error_date || 'recent'})`);
          failures += 1;
        } else {
          pass('Telegram webhook', 'no reported webhook error');
        }
      } else {
        pass('Telegram delivery mode', 'webhook is empty; the app is expected to use polling');
      }
      if (webhook.pending_update_count > 0) {
        warn('Pending Telegram updates', String(webhook.pending_update_count));
      }
    } catch (error) {
      fail('Telegram webhook/polling status', error.message);
      failures += 1;
    }
  }

  for (const route of ['/api/health', '/api/runtime-config']) {
    try {
      const result = await httpGet(route);
      if (result.status !== 200) {
        fail(route, `HTTP ${result.status}`);
        failures += 1;
      } else {
        let parsed;
        try { parsed = JSON.parse(result.text); } catch { parsed = null; }
        pass(route, parsed ? JSON.stringify(parsed) : 'HTTP 200');
        if (route === '/api/health' && parsed?.telegramConfigured !== true) {
          warn('/api/health Telegram status', 'telegramConfigured is false; Telegram commands are disabled');
        }
      }
    } catch (error) {
      fail(route, `${error.message}; is the server running at ${baseUrl}?`);
      failures += 1;
    }
  }

  try {
    const page = await httpGet('/');
    if (page.status !== 200) {
      fail('Pairing website', `HTTP ${page.status}`);
      failures += 1;
    } else {
      const requiredMarkers = ['WhatsApp Pairing', 'pair-request', 'pairing-code'];
      const missing = requiredMarkers.filter((marker) => !page.text.includes(marker));
      if (missing.length) {
        fail('Pairing website', `missing markers: ${missing.join(', ')}`);
        failures += 1;
      } else {
        pass('Pairing website', 'pair-request and pairing-code handlers are present');
      }
    }
  } catch (error) {
    fail('Pairing website', error.message);
    failures += 1;
  }

  if (sendTest) {
    if (!testChatId) {
      fail('Optional Telegram test message', 'set TELEGRAM_TEST_CHAT_ID before using --send-test');
      failures += 1;
    } else if (token) {
      try {
        const sent = await telegram('sendMessage', {
          chat_id: testChatId,
          text: 'Bali Gil verification test passed. Reply /start, then test /connect <full WhatsApp number>.',
        });
        pass('Optional Telegram test message', `sent message ${sent.message_id}`);
      } catch (error) {
        fail('Optional Telegram test message', error.message);
        failures += 1;
      }
    }
  } else {
    console.log('INFO  Pairing test — send /start and then /connect <full number> in Telegram manually.');
    console.log('INFO  This script does not call getUpdates because doing so can interfere with polling.');
  }

  const projectIndex = path.join(__dirname, '..', 'index.js');
  if (fs.existsSync(projectIndex)) pass('Local project files', 'index.js found');
  else warn('Local project files', 'index.js not found beside tools directory');

  if (failures) {
    console.error(`\n${failures} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log('\nAll automated checks passed. Complete the manual /connect pairing test next.');
  }
}
main().catch((error) => {
  fail('Verification script', error.message);
  process.exitCode = 1;
});
