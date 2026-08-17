# Telegram Verification Script

Run the read-only check from the project root:

```bash
npm run verify:telegram
```

For local testing, start the server in one terminal:

```bash
npm start
```

Then run the check in a second terminal:

```bash
TEST_BASE_URL=http://localhost:3000 npm run verify:telegram
```

For a deployed service, set the public URL instead:

```bash
TEST_BASE_URL=https://your-service.example npm run verify:telegram
```

The script checks the Telegram token with `getMe`, checks `getWebhookInfo` without consuming updates, checks `/api/health`, checks `/api/runtime-config`, and confirms that the website contains the pairing request and pairing-code handlers. It never prints the token and does not call `getUpdates`, because consuming updates can interfere with the bot’s polling process.

To send one controlled test message, set a Telegram chat ID and pass `--send-test`:

```bash
TELEGRAM_TEST_CHAT_ID=123456789 npm run verify:telegram -- --send-test
```

The test chat must have opened the bot and sent `/start` previously. The script does not automatically request a WhatsApp pairing code because that action requires a real phone number and creates a WhatsApp session. Complete that final test manually in Telegram:

```text
/start
/connect 923271054080
```

Use the real WhatsApp number with its country code. A successful pairing test produces a progress message followed by a temporary pairing code. If Telegram reports `409 Conflict`, stop every other local or deployed process using the same bot token.
