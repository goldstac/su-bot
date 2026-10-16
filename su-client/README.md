# SU Client

Pretty CLI to control SU Bot remotely — status, maintenance mode, features, messaging, and more.

## Setup

```bash
cd su-client
bun install
bun link   # optional: installs the `su` command globally
```

## Configuration

Set environment variables:
```bash
export BOT_URL="https://su-bot-t2a0.onrender.com"
export API_KEY="your-api-key"  # Must match bot's API_KEY
```

Or create a `.env` file:
```
BOT_URL=https://su-bot-t2a0.onrender.com
API_KEY=su-bot-api-key
```

## Commands

### Status & Health

| Command | Description |
|---------|-------------|
| `su botstatus` | Live dashboard: uptime, latency, memory, servers, features |
| `su status` | Alias of `botstatus` |
| `su uptime` | Show bot uptime |
| `su health` | Health check (no auth needed) |
| `su ping` | Measure API latency |

### Maintenance Mode

| Command | Description |
|---------|-------------|
| `su maintenance on [-r "reason"]` | Enable maintenance mode |
| `su maintenance off` | Disable maintenance mode |
| `su maintenance get` | Check current maintenance state |

While maintenance is on, users only see a maintenance notice for game commands — `su!botstatus`, `su!help`, `su!ping`, and `su!uptime` still work.

### Features

| Command | Description |
|---------|-------------|
| `su features list` | List all features |
| `su features add <name> [desc] [-e emoji]` | Add a feature |
| `su features remove <name>` | Remove a feature |

Features show up in the `su!changelog` command and `su!botstatus`.

### Messaging & Servers

| Command | Description |
|---------|-------------|
| `su send <channelId> <message>` | Send a message to a channel |
| `su say <channelId> <message>` | Alias of send |
| `su activity <text> [-t type]` | Set bot activity (playing/streaming/listening/watching/competing) |
| `su nickname <guildId> [name]` | Set bot nickname |
| `su guilds` | List all servers |
| `su channels <guildId>` | List channels in a server |

## Examples

```bash
# Check on your bot
su botstatus
su ping

# Do maintenance like a pro
su maintenance on -r "Rewriting the smite engine"
su maintenance off

# Announce a new feature
su features add "Coinflip Duels" "Battle friends with coins" -e "🪙"

# Talk to the mortals
su send 123456789 "New minigames just dropped. su!games"
su activity "su!games to gamble" -t watching
```
