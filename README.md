<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=230&color=0:6a0dad,100:ab47bc&text=BALI%20GIL&fontColor=ffffff&fontSize=85&fontAlignY=40&animation=twinkling&desc=Powered%20By%20ITACHI%20UCHIHA" />

<div style="
  margin-top: -60px;
  text-align: center;
  font-size: 32px;
  font-weight: 1000;  /* Nuclear bold - no skimping */
  letter-spacing: 3px;  /* Extra spacing for bold punch */
  background: linear-gradient(90deg, #6a0dad, #ab47bc, #d896ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow:
    0 0 12px #6a0dad,
    0 0 24px #ab47bc,
    0 0 36px #d896ff,
    0 0 48px #ab47bc;
  padding: 12px 0;
"> Built on Baileys • Designed for Speed • Enhanced for Stability • Powered by ITACHI UCHIHA 
</div>
</p>

<div align="center">

# 🌌 BALI GIL bot v4.0.1
**"Even the strongest of opponents always has a weakness."**

[![Status](https://img.shields.io/badge/status-Active-brightgreen?style=flat-square)](https://github.com/itachi-uchia34)
[![Version](https://img.shields.io/badge/version-4.0.1-blue?style=flat-square)](https://github.com/itachi-uchia34/Bali-gil-md/releases/tag/v4.0.1)
[![Owner](https://img.shields.io/badge/developer-Itachi%20Uchiha-red?style=flat-square)](https://github.com/itachi-uchia34)
[![Language](https://img.shields.io/badge/language-JavaScript-orange?style=flat-square)](https://github.com/itachi-uchia34)

![BALI GIL BOT](https://lh3.googleusercontent.com/d/18DX3oRbQ1E__z-64MUMOM-mRtmSfsLqr)

---
<div align="center">
<sub>Built with ❤️ and Genjutsu.</sub>
</div>

# 🩸 AKATSUKI MD — BALI GIL BOT

> *A Shroud-themed WhatsApp automation bot for group management, media, utilities, security, AI, games, and daily operations.*

**Akatsuki MD** is a Node.js WhatsApp bot powered by [Baileys](https://github.com/WhiskeySockets/Baileys). It includes a web pairing/dashboard layer, optional Telegram integration, persistent bot settings, media conversion, group moderation, automated protections, and a large command library.

> ⚔️ *Wear your ring. Honor the cloak. Follow the dynamic.*

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Starting the bot](#starting-the-bot)
- [WhatsApp pairing](#whatsapp-pairing)
- [Telegram integration](#telegram-integration)
- [Command usage](#command-usage)
- [Command catalog](#command-catalog)
- [Modular plugin system](#modular-plugin-system)
- [Akatsuki group management](#akatsuki-group-management)
- [Security and responsible use](#security-and-responsible-use)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [License](#license)

## Features

| Area | Included capabilities |
|---|---|
| **Akatsuki interface** | Themed `.menu`, `.help`, `.owner`, `.creator`, `.quote`, group announcements, rank messages, and the Akatsuki pairing gate. |
| **WhatsApp automation** | Pairing flow, persistent sessions, group events, media handling, reactions, read status, and status automation. |
| **Group management** | Add, remove, promote, demote, mute, tag, group information, links, descriptions, and profile pictures. |
| **Protection** | Anti-link, anti-call, anti-delete, anti-status, anti-bug, anti-spam-related controls, and configurable moderation behavior. |
| **Media and tools** | Stickers, image conversion, audio/video downloads, translation, QR, calculators, weather, search, and file utilities. |
| **AI and entertainment** | AI assistance, quotes, facts, jokes, riddles, games, anime tools, and creative utilities. |
| **Dashboard and integrations** | Express dashboard/API endpoints, Socket.IO support, optional Telegram command integration, and Railway deployment configuration. |

## Requirements

| Requirement | Recommended version or value |
|---|---|
| **Node.js** | 18 or newer; Node 20 or 22 is recommended. |
| **npm** | Included with Node.js. |
| **WhatsApp account** | A dedicated account is recommended for a bot. |
| **FFmpeg** | Bundled through `ffmpeg-static` for supported media conversion. |
| **Public host** | Required for a persistent deployment; Railway is configured in this repository. |

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/itachi-uchia34/Bali-gil-md.git
cd Bali-gil-md
npm install
```

Create a private environment file. Do not commit `.env`, session folders, tokens, passwords, or API keys:

```bash
cp .env.example .env
```

If `.env.example` is not present in your checkout, create `.env` manually using the variable table below. The bot also has safe code defaults for some non-secret settings, but production values should be configured explicitly.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `OWNER_NUMBER` | Recommended | Owner WhatsApp number, including country code. Use digits or a leading `+`; the bot normalizes the display. |
| `OWNER_TELEGRAM_ID` | Optional | Telegram user ID allowed to receive owner-level integration behavior. |
| `TELEGRAM_BOT_TOKEN` | Optional | Token created with Telegram’s [BotFather](https://t.me/BotFather). Required for Telegram commands and pairing messages. Regenerate it immediately if it has ever been exposed. |
| `OPENAI_API_KEY` | Optional | Enables features that use the configured OpenAI integration. Keep it only in the deployment secret manager. |
| `ADMIN_PASSWORD` | Recommended | Password for protected dashboard/admin operations. Use a long, unique value. |
| `PORT` | Optional | HTTP server port. Railway normally supplies `PORT`; local development defaults to port 3000. |
| `NODE_ENV` | Optional | Set to `production` on a hosted deployment. |

A production `.env` should look like this, with your own private values:

```dotenv
OWNER_NUMBER=923001234567
OWNER_TELEGRAM_ID=123456789
TELEGRAM_BOT_TOKEN=replace_with_a_new_botfather_token
OPENAI_API_KEY=replace_with_your_private_key
ADMIN_PASSWORD=replace_with_a_long_random_password
PORT=3000
NODE_ENV=production
```

Never paste real credentials into GitHub, README files, issue reports, chat messages, or screenshots. If a credential was committed previously, revoke it and create a replacement even if the file has since been deleted.

## Starting the bot

Start the production process locally:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The web service normally listens on `http://localhost:3000`. The actual port is controlled by `PORT` when it is set.

## WhatsApp pairing — Akatsuki Gate

1. Start the bot with `npm start`.
2. Open the dashboard and enter the **Akatsuki Gate** connection panel.
3. Enter the WhatsApp number using country code and digits. The recommended format is `923001234567`, without spaces or a leading `+`.
4. Select **Summon Pairing Code**, then enter the Shroud code in WhatsApp under **Linked devices**.
5. When the connection opens, the dashboard and optional Telegram notifications report that the Shroud and Six Paths are online.
6. Keep the session storage persistent in production. If the host uses an ephemeral filesystem, the bot may require pairing again after a restart.

For group commands, the bot account must be a group administrator. The sender must also have the required owner or admin permission for the command.

## Telegram integration

Telegram support is optional. To enable it:

1. Create a bot with [BotFather](https://t.me/BotFather).
2. Add the new token as `TELEGRAM_BOT_TOKEN` in Railway or your local secret store.
3. Restart or redeploy the service.
4. Confirm that the bot can receive messages and that the configured owner ID is correct.

Do not use a token from a public archive or commit history. Revoke any previously exposed token in BotFather before adding the replacement.

## Command usage

The default prefix is `.`. Use the built-in menus to discover commands:

```text
.menu
.help
.h
.allmenu
```

Most commands accept plain text after the command. Group-targeting commands generally accept either a mention or a reply to the target member.

Examples:

```text
.quote
.weather London
.sticker                 # Reply to an image or video
.dpz @member             # View a member profile picture
.tagall Team meeting at 20:00
.promote @member
.madarapromote @member    # Madara’s war-council promotion
.demote @member
.kick @member             # Pain’s Almighty Push removal
.ban @member              # Alias for the Almighty Push removal order
.tobiban @member          # Tobi’s Kamui ban
.mute                     # Pain’s Silent Shroud; admins only
.gcoff                    # Alias for .mute
.unmute                   # Restore group messaging
.gcon                     # Alias for .unmute
```

## Modular plugin system

New Akatsuki member themes and commands can be added without expanding the large built-in command switch. Place a JavaScript plugin file in `plugins/`; the bot discovers it at startup and merges its commands into the runtime registry.

A plugin exports a name, an optional `themes` object, and a `commands` object. Each command is an async function that receives the socket, chat ID, message, and a context object containing parsed arguments, permissions, session state, persistent bot data, and the command registry.

```js
module.exports = {
  name: 'akatsuki-members',
  themes: {
    pain: {
      name: 'Pain',
      title: 'The Six Paths of Pain',
      quote: 'Peace is forged by understanding the pain carried by every side.'
    }
  },
  commands: {
    painquote: async (sock, chatId, msg) => {
      await sock.sendMessage(chatId, { text: 'Your themed response' }, { quoted: msg });
    }
  }
};
```

The example plugin at `plugins/akatsuki.js` adds `.akatsuki`, `.painquote`, and `.tobiquote`. The companion plugin at `plugins/deidara-sasori.js` adds `.deidaraquote`, `.sasoriquote`, and `.artquote`, featuring explosive-art and puppet-control themes. After creating or changing a plugin, restart the bot so the loader can validate and register it. Command names must contain only letters, numbers, underscores, or hyphens, and duplicate plugin command names are rejected at startup.

All built-in and plugin commands receive a shared response layer from `lib/akatsuki-theme.js`. Plain text responses are given an Akatsuki MD header, while messages that already contain member-specific or Shroud-themed branding are preserved unchanged. Media payloads, reactions, mentions, group updates, and command APIs are not altered.

## Command catalog

The following catalog reflects the command families registered by the bot. Some commands require a group, administrator permission, owner permission, a reply, an API key, or an external service.

### 🩸 Akatsuki command center

| Command | Purpose |
|---|---|
| `.menu` | Main Akatsuki command-center menu with bot information. |
| `.help`, `.h` | Concise Akatsuki help menu. |
| `.allmenu` | Full command index. |
| `.owner`, `.creator` | Itachi Uchiha-themed owner and creator profile. |
| `.quote` | Rotating Akatsuki quote featuring Pain, Tobi, Itachi, Konan, Kisame, Deidara, or Sasori. |
| `.akatsuki`, `.painquote`, `.tobiquote` | Example plugin commands for member registry and themed quotes. |
| `.deidaraquote`, `.sasoriquote`, `.artquote` | Deidara explosive-art, Sasori puppet-control, and combined artistry quotes. |
| `.ping`, `.runtime`, `.uptime` | Check response time and process uptime. |
| `.serverinfo`, `.speedtest`, `.device` | Inspect server, network, and device information. |

### ⚔️ Group management and ranks

| Commands | Purpose |
|---|---|
| `.add`, `.invite`, `.join` | Add members, manage invitations, or join a group where permitted. |
| `.kick`, `.ban` | Invoke Pain’s Almighty Push (`SHINRA TENSEI!`) to remove a tagged or replied-to member. Both commands use the same protected moderation flow. |
| `.tobiban` | Tobi’s Kamui-themed removal order with the same admin and target protections. |
| `.promote`, `.demote`, `.revoke` | Grant or revoke group administrator rank. |
| `.madarapromote` | Madara’s war-council promotion command with multi-member mention support. |
| `.tagall`, `.hidetag`, `.tagadmin`, `.tagme` | Announce to members, mention silently, tag administrators, or tag yourself. |
| `.groupinfo`, `.grouplink` | View group information or retrieve the group link. |
| `.setname`, `.setdesc`, `.setppgc` | Update group name, description, or profile picture. |
| `.mute`, `.gcoff` | Activate Pain’s Silent Shroud and restrict group messages to admins, where supported. |
| `.unmute`, `.gcon` | Release the Shroud and reopen messaging for all members, where supported. |
| `.leave`, `.listonline`, `.everyonemsg` | Leave a group, inspect online members, or send an everyone message. |
| `.welcome`, `.goodbye` | Configure themed arrival and departure messages with `on`, `off`, or `status`. |
| `.poll`, `.editmsg`, `.react`, `.send`, `.forward`, `.save`, `.clear` | Group communication and message utilities. |

### 🛡️ Security barriers and automation

| Commands | Purpose |
|---|---|
| `.antilink on` | Delete detected links. |
| `.antilink kick` | Delete links and remove the sender; use only with clear group consent. |
| `.antilink off`, `.antilink status` | Disable or inspect anti-link protection. |
| `.antibug`, `.anticall`, `.antidelete`, `.antistatus` | Configure the corresponding protection modules where enabled. |
| `.autoreact`, `.autoreacts` | Enable or disable rotating emoji reactions. |
| `.autoread`, `.autostatus` | Configure read-status and status automation. |
| `.mode`, `.public`, `.private` | Control bot operating mode. |

### 🎴 Media and downloads

| Commands | Purpose |
|---|---|
| `.sticker` | Convert replied-to images or videos into WebP stickers. |
| `.dpz`, `.dp` | Show a tagged or replied-to member’s profile picture with an Akatsuki member-themed caption. |
| `.toimg` | Convert a sticker to an image. |
| `.tomp3`, `.song`, `.video` | Convert or retrieve audio/video media. |
| `.youtube`, `.ytmp3`, `.ytmp4`, `.yts` | YouTube search and media utilities. |
| `.tiktok`, `.instagram`, `.facebook`, `.pinterest`, `.twitter`, `.reddit` | Supported social-media retrieval utilities. |
| `.spotify`, `.mediafire`, `.mf`, `.gdrive`, `.apk`, `.threads`, `.snapchat`, `.capcut`, `.terabox` | Additional retrieval utilities where the upstream service is available. |
| `.blur`, `.crop`, `.flip`, `.grayscale`, `.invert`, `.removebg`, `.enlarge`, `.enhance`, `.upscale`, `.remini` | Image editing and enhancement tools. |
| `.pdf`, `.ocr`, `.screenshot`, `.qr` | Document, text-recognition, screenshot, and QR utilities. |

### 🤖 AI and knowledge

| Commands | Purpose |
|---|---|
| `.ai`, `.chatbot`, `.chatgpt`, `.gemini`, `.llama`, `.deepseek`, `.blackbox` | AI assistant integrations, subject to configured providers and keys. |
| `.imagine`, `.flux`, `.pixart`, `.dalle`, `.bingai`, `.midjourney` | Image-generation integrations where configured. |
| `.translate`, `.dict`, `.wiki`, `.google`, `.define`, `.weather`, `.ipinfo`, `.whois`, `.dnslookup` | Translation, reference, search, weather, network, and domain utilities. |
| `.news`, `.crypto`, `.movie`, `.lyrics`, `.manga`, `.github`, `.npm`, `.playstore` | Information and service lookup utilities. |
| `.base64`, `.binary`, `.hex`, `.morse`, `.calc`, `.shorturl`, `.pastebin` | Encoding, calculation, shortening, and text utilities. |

### 🎭 Fun, quotes, games, and anime

| Commands | Purpose |
|---|---|
| `.joke`, `.meme`, `.dare`, `.truth`, `.roast`, `.compliment`, `.pickup`, `.insult`, `.flirt` | Social and entertainment responses. |
| `.ascii`, `.character`, `.fact`, `.trivia`, `.riddle`, `.wouldyourather`, `.8ball`, `.coinflip`, `.roll` | Games, prompts, and text entertainment. |
| `.ship`, `.emojimix`, `.hack`, `.report` | Fun utilities and reporting workflows. |
| `.tictactoe`, `.chess`, `.hangman` | Interactive game commands where implemented. |
| `.anime`, `.character`, `.manga` | Anime and manga-related utilities. |

### 🕌 Islamic utilities

| Commands | Purpose |
|---|---|
| `.quran`, `.hadith` | Retrieve Quran and Hadith content from configured sources. |
| `.prayer`, `.qibla` | Prayer-time and Qibla utilities where location data is available. |
| `.asmaulhusna` | Display the names of Allah. |

### 👑 Owner and system administration

| Commands | Purpose |
|---|---|
| `.public`, `.private`, `.mode` | Change bot availability mode. |
| `.block`, `.unblock` | Manage blocked contacts. |
| `.broadcast`, `.bcall`, `.bcgc` | Owner broadcast utilities. |
| `.restart`, `.shutdown`, `.xrestart`, `.xshutdown` | Process-control commands; owner-only and host-dependent. |
| `.backup`, `.restore`, `.clone`, `.nuke`, `.deleteall` | Administrative data or process operations; review the implementation before use. |
| `.addsudo`, `.delsudo`, `.listsudo`, `.setprefix`, `.setname` | Owner configuration and access-management utilities where enabled. |
| `.password`, `.mycmd`, `.gali` | Additional owner or utility commands. |

### ⚠️ Restricted or experimental operations

The repository contains legacy commands with names such as `.spam`, `.smsbomb`, `.callbomb`, `.crash`, `.freeze`, `.lag`, `.bug`, `.locspam`, `.vcardspam`, `.buttonspam`, `.pollspam`, and `.contactspam`. These should not be used against people, phone numbers, services, or infrastructure. They may violate provider terms, local law, or platform safety rules. Keep them disabled or remove them from production if they are not required for a legitimate, authorized test environment.

## Akatsuki group management

The themed management commands are designed for controlled group administration:

```text
.welcome on
.welcome off
.welcome status
.goodbye on
.goodbye off
.goodbye status
.antilink on
.antilink kick
.antilink status
.tagall Maintenance begins now
.promote @member
.demote @member
.kick @member
.ban @member
.mute
.gcoff
.unmute
.gcon
```

The bot must be a group administrator for actions such as removing members, changing ranks, deleting messages, muting a group, or changing group metadata. Use moderation commands transparently and only with the group’s consent and applicable platform rules.

## Deployment

### Railway

This repository includes `railway.toml` with the following deployment behavior:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
```

To deploy on Railway:

1. Create a Railway project and connect the GitHub repository.
2. Add environment variables in the Railway Variables panel. Never commit them to the repository.
3. Deploy from `main`.
4. Confirm the service is listening on Railway’s assigned `PORT`.
5. Keep authentication/session storage persistent if the bot must remain paired.
6. Review deployment logs after every change.

### Process manager

`ecosystem.config.js` provides an optional PM2 configuration for a persistent Node process:

```bash
npm install --global pm2
pm2 start ecosystem.config.js
pm2 save
```

Use a process manager only where the hosting platform supports it. On Railway, the platform start command is normally sufficient.

### Vercel note

This bot is a long-running Node process with WebSocket, pairing, and session requirements. Vercel is not the preferred host for the bot process. Use Railway or another host that supports persistent Node services and storage.

## Troubleshooting

| Symptom | Checks |
|---|---|
| **The bot does not start** | Run `node --check index.js`, confirm `npm install` completed, inspect the first startup error, and verify the Node version is 18 or newer. |
| **`.help` or `.menu` does not respond** | Confirm the bot process is online, the prefix is `.`, and the message is sent to the paired WhatsApp account. |
| **Pairing code is not delivered** | Use digits with country code, verify the session is not already active, inspect Railway logs, and ensure the host retains session files. |
| **Group actions fail** | Make the bot a group administrator, use a mention or reply target, and confirm the sender has admin permission. |
| **Telegram commands do not work** | Configure a newly generated `TELEGRAM_BOT_TOKEN`, verify the owner ID, restart the service, and inspect Telegram startup logs. |
| **Stickers fail** | Reply to a supported image/video, keep videos within the implementation limit, and confirm FFmpeg/sharp dependencies installed correctly. |
| **Deployment is healthy but the bot disconnects** | Check session persistence, memory limits, reconnect logs, and whether the host terminates idle or non-persistent processes. |
| **A secret was exposed** | Revoke it immediately, generate a replacement, remove it from tracked files and history where appropriate, and store it only in the host’s secret manager. |

## Project structure

```text
.
├── commands/            # Built-in bot command handlers
├── plugins/             # Modular Akatsuki plugins discovered at startup
├── lib/                 # Shared utilities and plugin loader
├── data/                # Runtime bot data; keep private in production
├── auth_info_baileys/   # WhatsApp session data; never commit
├── index.js             # Bot entrypoint, dispatcher, web server, and events
├── settings.js          # Non-secret defaults and bot identity settings
├── package.json         # Scripts and dependencies
├── railway.toml         # Railway build/deploy configuration
├── ecosystem.config.js  # Optional PM2 configuration
├── song.mp3             # Optional menu audio asset
└── README.md            # This documentation
```

## Development checklist

Before pushing a change:

```bash
node --check index.js
for file in commands/*.js; do node --check "$file"; done
git diff --check
npm start
```

Before deploying, verify that no `.env`, token, password, auth session, or private runtime data is included in the Git diff.

## License

This project is released under the **MIT License**. Review the terms of every upstream API, media service, and third-party package before using the associated command in production.

> 🩸 *The Shroud watches. Build responsibly.*
