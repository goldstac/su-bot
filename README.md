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
| `su!track` | What nasheed or surah you are listening to right now |
| `su!track link` | Connect your Quran app to the bot |
| `su!fm` | How many times you listened to what |
| `su!fm recent` | Your last 10 plays |
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

## Quran & Nasheed Tracking

Link the [Quran app](https://github.com/goldstac/quran) and the bot keeps up with what you listen to: now playing, play counts, top nasheeds, top reciters, and how much time you spent listening.

1. Run `su!track link` in Discord to get a 6 character code (valid for 10 minutes)
2. Open the Quran app, go to **Settings → Discord bot**
3. Paste the code and hit **Link**

| Command | Description |
|---------|-------------|
| `su!track` | Now playing card with a live progress bar |
| `su!track @user` | What someone else is listening to |
| `su!track link` | Generate a fresh link code |
| `su!track unlink` | Stop the app from reporting (stats are kept) |
| `su!track off` / `su!track on` | Pause / resume recording your plays |
| `su!fm` | All time stats: plays, time, top nasheeds, top channels, Quran vs nasheeds split |
| `su!fm week` / `su!fm month` | Same breakdown for the last 7 or 30 days |
| `su!fm @user week` | Peek at someone else's week |
| `su!fm recent` | Your last 10 plays with relative times |

Privacy: hiding a single nasheed in the app (the eye button on a row) keeps that nasheed out of the bot entirely, and `su!track off` turns recording off from Discord. Stats live in `data/quran.json` on the bot.

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
| `/api/quran/link` | POST | Exchange a `su!track link` code for an app token — public |
| `/api/quran/event` | POST | Playback events from the Quran app (per-user token) — public |
| `/api/quran/stats` | GET | How many apps are linked |

All `/api/*` endpoints require the `Authorization: <API_KEY>` header, except `/api/quran/link` and `/api/quran/event`, which use the per-user token from the link flow.

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
