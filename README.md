# ⚡ SU Bot

Like `sudo su`, but for smiting mortals.

## Commands

| Command | Description |
|---------|-------------|
| `su!smite @user` | Smite a user with animated lightning |
| `su!smite @user ?r reason` | Smite with a custom reason |
| `su!smite.larp @user` | Extra deadly LARP termination smite |
| `su!larp <something>` | Larp as something (full RPG system inside) |
| `su!games` | Minigames: slots, coinflip, dice, trivia, RPS & more |
| `su!work` | Earn free points (30 min cooldown) |
| `su!afk [reason]` | Set yourself as AFK |
| `su!botstatus` | Live bot status: uptime, latency, memory, features |
| `su!changelog` | See what's new |
| `su!uptime` | Show bot uptime |
| `su!ping` | Check bot and API latency |
| `su!help` | List all commands |
| `su!version` | Show bot version |
| `su!credits` | Show credits |

## Minigames

All games share one wallet with the LARP system — gamble your LARP points:

| Game | Command | Payout |
|------|---------|--------|
| 🪙 Coinflip | `su!coinflip <heads\|tails> <bet>` | 2x |
| 🎰 Slots | `su!slots <bet>` | up to 25x |
| 🎲 Dice | `su!dice <over\|under> <2-98> <bet>` | scales with odds |
| 🧠 Trivia | `su!trivia` | 200 pts (first correct answer) |
| 🔢 Guess | `su!guess <1-10> <bet>` | 10x |
| ✊✋✌️ RPS | `su!rps <rock\|paper\|scissors> <bet>` | 1.5x |
| 💼 Work | `su!work` | free points, 30 min cooldown |

Bets accept a number or `all`. Use `su!games balance` to check your wallet and `su!games leaderboard` for the richest players.

## Bot Status & Maintenance

- `su!botstatus` — live dashboard: uptime, API latency, memory, servers, users, feature list, and maintenance state
- `su!changelog` — what's new
- **Maintenance mode** — when enabled (via the CLI), all commands except status/help/ping are blocked with a maintenance notice, and the bot's activity shows the reason

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

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (uptime, version, status) — public |
| `/api/botstatus` | GET | Full status dashboard data |
| `/api/maintenance` | POST | Toggle maintenance mode `{enabled, reason}` |
| `/api/features` | GET/POST | List / add / remove features |
| `/api/send` | POST | Send a channel message |
| `/api/status` | POST | Set bot activity |
| `/api/nickname` | POST | Set bot nickname |
| `/api/guilds` | GET | List servers |
| `/api/channels/:guildId` | GET | List channels |

All `/api/*` endpoints require the `Authorization: <API_KEY>` header.

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

## SU Client

CLI tool to control the bot remotely. See [su-client/README.md](su-client/README.md).

```bash
cd su-client && bun install
su botstatus                 # live uptime, latency, features
su maintenance on -r "vibe check"
su maintenance off
su features add "New Thing" "Does new things"
su send <channelId> "Hello!"
su guilds
```

## Made by

**Li Productions** - [github.com/goldstac/su-bot](https://github.com/goldstac/su-bot)
