# Discord Bot Template

A lean, production-ready Discord bot template with PostgreSQL (Prisma), slash + prefix commands, per-guild prefix and comprehensive logging.

## Features

- ⚡ **Discord.js v14** — slash + message (prefix) commands
- 🗄️ **PostgreSQL + Prisma** — single `guild_settings` table (prefix per guild)
- 🔒 **Security-first** — sanitized errors, no `NODE_ENV` branching
- 🛡️ **Anti-crash** — handlers for rejections/exceptions + Discord logs
- 📝 **Webhook logging** — env-only `LOGS_*_WEBHOOK` (no `LOGS_DEFAULTWEBHOOK` fallback)
- 🎯 **Permission system** — `DEFAULT_*` + `userPermissions`/`botPermissions` via `module.exports`
- ⏱️ **Cooldown** — per-user, dev bypass 2-5s
- 📋 **Guild restriction** — `guildIds` via `settings.json` `developer.guildids` or per-command array
- 🔤 **Per-guild prefix** — `settings.json:prefix` default `!`, override per-guild in DB (`!prefix` / `/config prefix`)
- 📊 **Help** — slash ` /info help` + message `!help`
- 🔧 **Modular** — `Src/Commands/Slash` + `Src/Commands/Message`

## Prerequisites

- **Node.js** >= 20.19.0
- **npm** >= 10.0.0
- **PostgreSQL** >= 12 (optional — bot runs without DB, prefix falls back to `!`)
- **Discord Bot Token** — https://discord.com/developers/applications

## Quick Start

### 1. Clone
```bash
git clone https://github.com/ShadowGaming100/Discord-Bot-Template.git
cd Discord-Bot-Template
```

### 2. Install
```bash
npm install
```

### 3. Configure
```bash
cp .env.example .env
```
Edit `.env` — **only secrets** (everything else is `Src/Settings/*.json`):
```env
SETTINGS_BOT_TOKEN=your_bot_token_here
SETTINGS_BOT_CLIENTID=your_client_id_here
SETTINGS_BOT_CLIENTSECRET=
DATABASE_URL=postgresql://postgres:password@localhost:5432/discord_bot
LOGS_ERRORLOGS_WEBHOOK=
LOGS_COMMANDLOGS_WEBHOOK=
LOGS_CLIENTLOGS_WEBHOOK=
```

### 4. Database (optional)
```bash
npx prisma db push
npx prisma generate
```
Single table `guild_settings` (`guildId`, `prefix`). No `tableSchemas.js` — schema is `prisma/schema.prisma` only.

### 5. Start
```bash
npm run dev   # node index.js
npm start
```

## Project Structure

```
Discord-Bot-Template/
├── Src/
│   ├── Commands/
│   │   ├── Slash/          # Slash commands — Info/Bot, Info/Server, Info/User, Config
│   │   │   └── Config/prefix.js  # /config prefix
│   │   └── Message/        # Message (prefix) commands — mirrors Slash, manual
│   │       └── Config/prefix.js  # !prefix
│   ├── Events/
│   │   ├── Client/ready.js
│   │   ├── Interaction/interactionCreate.js
│   │   └── Message/messageCreate.js # prefix + guildIds + perms + cooldown
│   ├── Functions/
│   │   ├── database.js     # Prisma only (DATABASE_URL)
│   │   ├── logger.js       # Webhook-only, 3 types (error/command/client)
│   │   ├── permissions.js  # 52 labels + DEFAULT_* 
│   │   ├── security-utils.js # sanitizeErrorMessage (always generic) + sanitizeForLogging
│   │   ├── format-utils.js # formatUptime/formatBytes
│   │   └── clientSettingsObject.js # hardcoded 4 intents
│   ├── Handlers/
│   │   ├── slashCommands.js
│   │   ├── messageCommands.js
│   │   ├── events.js
│   │   └── antiCrash.js
│   └── Settings/
│       ├── settings.json    # bot/developer/statuses/prefix (no client.intents, no owner_ids)
│       └── logs.json        # deleted — logger uses env only, always enabled
├── prisma/schema.prisma     # GuildSettings only
├── index.js                 # loads dotenv, validates token/clientId, login, message+slash
├── .env.example             # secrets only
└── package.json
```
Deleted: `config.js`, `Src/Settings/server.json` (DB now `DATABASE_URL` only), `Src/Functions/validation.js`, `tableSchemas.js`, `logs.json` enabled bloat, `NODE_ENV`/`DB_AUTO_INIT` branching.

## Command Structure

Slash (global):
```
/info bot ping | stats(botstats) | uptime | invite | commandcount
/info server banner(serverbanner) | boostinfo | emoji | enlargeemoji | getchannelinvite | info(serverinfo) | inviteinfo | listroles | membercount | role(roleinfo)
/info user avatar | banner(userbanner) | id(userid) | whois
/info help
/config prefix [newPrefix]
```

Message (prefix `!` default, per-guild via `!prefix`):
```
!ping, !botstats, !uptime, !invite, !commandcount
!serverbanner, !boostinfo, !emoji, !enlargeemoji, !getchannelinvite, !serverinfo, !inviteinfo, !listroles, !membercount, !roleinfo
!avatar, !userbanner, !userid, !whois
!help [command]
!prefix [newPrefix]  (ManageGuild)
```

## Adding New Commands

Slash: `Src/Commands/Slash/[Category]/name.js`
```js
const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  name: 'commandname',
  description: '...',
  category: 'Info',
  cooldown: 5,
  guildIds: ["123"], // or true → settings.developer.guildids
  userPermissions: ["ManageMessages"],
  botPermissions: ["EmbedLinks"],
  data: new SlashCommandBuilder().setName('commandname').setDescription('...'),
  async execute(client, interaction) { await interaction.reply('Hello!'); }
};
```

Message: `Src/Commands/Message/[Category]/name.js`
```js
module.exports = {
  name: 'commandname',
  aliases: ['alias'],
  description: '...',
  guildIds: ["123"],
  userPermissions: ["ManageMessages"],
  botPermissions: ["EmbedLinks"],
  cooldown: 5,
  async execute(client, message, args) { await message.reply('Hello!'); }
};
```

Both auto-loaded. Restart not needed for slash global (1h cache).

## Command Flags (module.exports, no fallback)

| Flag | Type | Effect |
|------|------|--------|
| `cooldown` | number | per-user s (dev bypass 2/5s) |
| `devOnly` | boolean | `settings.developer.ids` only |
| `guildOnly` | boolean | guild only |
| `guildIds` | string[] or `true` | `true` → `settings.developer.guildids`, else array → only those guilds |
| `userPermissions` / `memberPermissions` | string[] | merged with `DEFAULT_USER_PERMISSIONS` |
| `botPermissions` | string[] | merged with `DEFAULT_BOT_PERMISSIONS` |
| `nsfwOnly` / `voiceOnly` | boolean | nsfw/voice channel only |
| `maintenanceCmd` / `toggleOffCmd` | boolean | dev-only / disabled |

Defaults (`Src/Functions/permissions.js`): `DEFAULT_USER ["SendMessages","ViewChannel","UseApplicationCommands"]`, `DEFAULT_BOT ["ViewChannel","EmbedLinks","SendMessages","ReadMessageHistory"]`. No `premiumOnly`/`allowedGuilds` fallback.

## Gateway Intents

Hardcoded in `Src/Functions/clientSettingsObject.js` (not `settings.json`):
`Guilds, GuildMembers, GuildMessages, MessageContent` — `MessageContent` is privileged, enable in Dev Portal if you use prefix commands.

## Database

Single table `guild_settings` (`guildId`, `prefix`). Prefix flow: `messageCreate.js:getPrefix()` → cache 60s → `prisma.guildSettings.findUnique({guildId})` → `row.prefix` else `settings.prefix`. Change via `!prefix new` or `/config prefix new` → `prisma.guildSettings.upsert` + `setCachedPrefix`.

Env: `DATABASE_URL` only — see Environment Variables.


## Environment Variables (secrets only)

| Variable | Description | Example |
|----------|-------------|---------|
| `SETTINGS_BOT_TOKEN` | Bot token (required) | `MT...` |
| `SETTINGS_BOT_CLIENTID` | Application ID (required) | `123...` |
| `SETTINGS_BOT_CLIENTSECRET` | Client secret | `` |
| `DATABASE_URL` | Postgres URL (required for DB) | `postgresql://postgres:password@localhost:5432/discord_bot` |
| `LOGS_ERRORLOGS_WEBHOOK` | Error webhook | `https://...` |
| `LOGS_COMMANDLOGS_WEBHOOK` | Command webhook | `https://...` |
| `LOGS_CLIENTLOGS_WEBHOOK` | Client webhook | `https://...` |

Other settings are `Src/Settings/settings.json` (`developer.ids/guildids`, `prefix`, `statuses`).

## Logging

Webhook-only, no `LOGS_DEFAULTWEBHOOK` fallback — if per-type webhook empty, `logger.js` warns and returns `false`. No `channelId` — webhooks only. Types: `error` (antiCrash + ready), `command` (interactionCreate), `client` (ready/shutdown). Configure per-type `enabled` in code or keep always enabled (current `logs.json` deleted).

1. Create webhook in Discord → Server Settings → Integrations → Webhooks
2. Add URL to `.env` as above.

## Testing

```bash
npm test        # node --test (no deps)
npm run lint    # eslint
npm run format  # prettier
```

## Troubleshooting

**Bot won't start** — Check `SETTINGS_BOT_TOKEN`/`CLIENTID` in `.env`, Node >=20.19.

**Commands not showing** — Global register 1h cache, re-invite with `bot + applications.commands` scope.

**Database errors** — Verify `DATABASE_URL` for Prisma, `npx prisma db push`.

**Prefix not changing** — Need `Manage Server` perm, DB must be up (`!prefix` without arg shows current).

## License

ISC — see LICENSE.

## Acknowledgments

- [Discord.js](https://discord.js.org/)
- [Prisma](https://www.prisma.io/)
