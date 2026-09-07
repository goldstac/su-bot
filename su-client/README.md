# SU Client

CLI tool to control SU Bot remotely.

## Setup

```bash
cd su-client
bun install
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

## Usage

```bash
# Run directly
bun cli.ts <command>

# Or link globally
bun link
su <command>
```

## Commands

| Command | Description |
|---------|-------------|
| `su send <channelId> <message>` | Send a message to a channel |
| `su status <text>` | Set bot activity status |
| `su status <text> -t watching` | Set status type (playing/streaming/listening/watching/competing) |
| `su nickname <guildId> [name]` | Set bot nickname |
| `su guilds` | List all servers |
| `su channels <guildId>` | List channels in a server |
| `su health` | Check bot health |

## Examples

```bash
# Send a message
su send 123456789 "Hello from CLI!"

# Set playing status
su status "sudo su!smite @someone"

# Set watching status
su status "the server" -t watching

# Set nickname
su nickname 123456789 "SU Bot"

# List guilds
su guilds

# List channels
su channels 123456789
```
