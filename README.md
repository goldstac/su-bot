# ⚡ SU Bot

Like `sudo su`, but for smiting mortals.

## Commands

| Command | Description |
|---------|-------------|
| `su!smite @user` | Smite a user with animated lightning |
| `su!smite @user ?r reason` | Smite with a custom reason |
| `su!ping` | Check bot and API latency |
| `su!help` | List all commands |
| `su!version` | Show bot version |
| `su!credits` | Show credits |

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create a `.env` file with your bot token:
```
DISCORD_TOKEN=your-bot-token-here
```

3. Run the bot:
```bash
bun run start
```

For development with hot reload:
```bash
bun run dev
```

## Hosting on Render

1. Push to GitHub
2. Create a **Web Service** on Render
3. Set build command: `bun install`
4. Set start command: `bun run src/index.ts`
5. Add `DISCORD_TOKEN` environment variable

Use [UptimeRobot](https://uptimerobot.com/) to ping the `/health` endpoint to keep it alive.

## Stack

- TypeScript
- Bun runtime
- Discord.js v14
- Canvas (lightning animations)
- Express (web server for hosting)

## Bot Permissions

- Send Messages
- Attach Files
- Embed Links
- Read Message History

## Made by

**Li Productions** - [github.com/goldstac/su-bot](https://github.com/goldstac/su-bot)
