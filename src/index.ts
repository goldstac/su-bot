import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  Message,
  TextChannel,
} from "discord.js";
import express from "express";
import { handleSmite } from "./commands/smite";
import { handlePing } from "./commands/ping";
import { handleCredits } from "./commands/credits";
import { handleVersion } from "./commands/version";
import { handleHelp } from "./commands/help";
import { handleAfk, checkAfkRemove, checkAfkMention } from "./commands/afk";

const PREFIX = "su!";
const processed = new Set<string>();
const API_KEY = process.env.API_KEY || "su-bot-api-key";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SU Bot is running! ⚡");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// API endpoints for su-client
app.post("/api/send", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { channelId, content } = req.body;
  if (!channelId || !content) {
    return res.status(400).json({ error: "channelId and content required" });
  }
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !("send" in channel)) {
      return res.status(404).json({ error: "Channel not found" });
    }
    await (channel as TextChannel).send(content);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/status", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { status, type } = req.body;
  if (!status) {
    return res.status(400).json({ error: "status required" });
  }
  try {
    client.user?.setActivity(status, { type: type || 0 });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/nickname", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { guildId, nickname } = req.body;
  if (!guildId) {
    return res.status(400).json({ error: "guildId required" });
  }
  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.members.me?.setNickname(nickname || "");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/guilds", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const guilds = client.guilds.cache.map((g) => ({
    id: g.id,
    name: g.name,
    memberCount: g.memberCount,
  }));
  res.json({ guilds });
});

app.get("/api/channels/:guildId", async (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const guild = await client.guilds.fetch(req.params.guildId);
    const channels = guild.channels.cache
      .filter((c) => c.type === 0)
      .map((c) => ({ id: c.id, name: c.name }));
    res.json({ channels });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`⚡ SU Bot is online as ${readyClient.user.tag} (sudo su)`);
  readyClient.user.setActivity("sudo su!smite @someone", { type: 0 });
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  // Check AFK - remove if user sends a message
  checkAfkRemove(message);

  // Check AFK - notify if a mentioned user is AFK
  await checkAfkMention(message);

  if (!message.content.startsWith(PREFIX)) return;
  if (processed.has(message.id)) return;
  processed.add(message.id);
  setTimeout(() => processed.delete(message.id), 5000);

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "smite") {
    await handleSmite(message, args);
  } else if (command === "ping") {
    await handlePing(message);
  } else if (command === "credits") {
    await handleCredits(message);
  } else if (command === "version") {
    await handleVersion(message);
  } else if (command === "help") {
    await handleHelp(message);
  } else if (command === "afk") {
    await handleAfk(message, args);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ Missing DISCORD_TOKEN in environment variables");
} else {
  client.login(token).catch((err) => {
    console.error("❌ Failed to login to Discord:", err.message);
  });
}
