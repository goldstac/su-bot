import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  Message,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import express from "express";
import { handleSmite } from "./commands/smite";
import { handlePing } from "./commands/ping";
import { handleCredits } from "./commands/credits";
import { handleVersion } from "./commands/version";
import { handleHelp } from "./commands/help";
import { handleAfk, checkAfkRemove, checkAfkMention } from "./commands/afk";
import { handleLarp } from "./commands/larp";
import { handleGames } from "./commands/games";
import { handleBotStatus, handleChangeLog } from "./commands/botstatus";
import { handleTrack, handleFm } from "./commands/quran";
import { redeemLinkCode, recordEvent, linkedCount } from "./quran";
import { botState, setMaintenance, addFeature, removeFeature, uptimeString, VERSION, STARTED_AT } from "./state";

const PREFIX = "su!";
const processed = new Set<string>();
const API_KEY = process.env.API_KEY || "su-bot-api-key";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SU Bot is running! ⚡");
});

app.get("/health", (req, res) => {
  res.json({
    status: botState.maintenance ? "maintenance" : "ok",
    uptime: process.uptime(),
    uptimeHuman: uptimeString(),
    version: VERSION,
    startedAt: STARTED_AT,
  });
});

// Bot status dashboard data (for CLI + monitoring)
app.get("/api/botstatus", (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const mem = process.memoryUsage();
  res.json({
    version: VERSION,
    status: botState.maintenance ? "maintenance" : "online",
    maintenance: botState.maintenance,
    maintenanceReason: botState.maintenanceReason,
    uptime: process.uptime(),
    uptimeHuman: uptimeString(),
    startedAt: STARTED_AT,
    apiLatency: client.ws.ping,
    memoryMB: +(mem.heapUsed / 1024 / 1024).toFixed(1),
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    features: botState.features,
  });
});

// Maintenance mode toggle
app.post("/api/maintenance", (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { enabled, reason } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled (true/false) required" });
  }
  setMaintenance(enabled, reason);
  // Update bot activity to reflect maintenance
  client.user?.setActivity(
    enabled ? `🔧 Maintenance: ${reason || "back soon"}` : "sudo su!smite @someone",
    { type: 0 }
  );
  res.json({ success: true, maintenance: enabled, reason: botState.maintenanceReason });
});

// Feature list management
app.get("/api/features", (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ features: botState.features });
});

app.post("/api/features", (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { action, name, desc, emoji } = req.body;
  if (!action || !name) {
    return res.status(400).json({ error: "action (add/remove) and name required" });
  }
  if (action === "add") {
    const ok = addFeature(name, desc || "", emoji);
    return ok
      ? res.json({ success: true, features: botState.features })
      : res.status(409).json({ error: `Feature "${name}" already exists` });
  }
  if (action === "remove") {
    const ok = removeFeature(name);
    return ok
      ? res.json({ success: true, features: botState.features })
      : res.status(404).json({ error: `Feature "${name}" not found` });
  }
  res.status(400).json({ error: "action must be add or remove" });
});

// ─────────────────────────────────────────────
//  Quran app integration (no API key: the app links
//  itself with a one-time code and gets its own token)
// ─────────────────────────────────────────────
app.post("/api/quran/link", (req, res) => {
  const result = redeemLinkCode(req.body?.code);
  if (!result.ok) {
    return res.status(400).json(result);
  }
  console.log(`🎧 Quran app linked for ${result.user.name} (${result.user.id})`);
  res.json(result);
});

app.post("/api/quran/event", (req, res) => {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const result = recordEvent(token, req.body);
  if (!result.ok) {
    const status = result.error === "Unknown or revoked token" ? 401 : 400;
    return res.status(status).json(result);
  }
  res.json({ ok: true });
});

app.get("/api/quran/stats", (req, res) => {
  if (req.headers.authorization !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ linked: linkedCount() });
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

  // Maintenance mode: only allow status/info commands through
  const allowedInMaintenance = ["botstatus", "status", "help", "ping", "uptime", "changelog", "track", "fm"];
  if (botState.maintenance && !allowedInMaintenance.includes(command || "")) {
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle("🔧 Under Maintenance")
      .setDescription(
        `The bot is currently under maintenance.\n\n> ${botState.maintenanceReason || "We'll be back soon!"}\n\n` +
        `You can still use: ${allowedInMaintenance.map((c) => `\`su!${c}\``).join(", ")}`
      );
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (command === "smite" || command === "smite.larp") {
    const isLarpSmite = command === "smite.larp";
    await handleSmite(message, args, isLarpSmite);
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
  } else if (command === "larp") {
    await handleLarp(message, args);
  } else if (command === "games" || command === "game") {
    await handleGames(message, args);
  } else if (command === "botstatus" || command === "status") {
    await handleBotStatus(message);
  } else if (command === "changelog" || command === "new") {
    await handleChangeLog(message);
  } else if (command === "uptime") {
    await message.channel.send({ content: `⏱️ Uptime: **${uptimeString()}**` });
  } else if (command === "track") {
    await handleTrack(message, args);
  } else if (command === "fm" || command === "quranfm") {
    await handleFm(message, args);
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
