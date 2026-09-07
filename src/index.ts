import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  Message,
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

const app = express();

app.get("/", (req, res) => {
  res.send("SU Bot is running! ⚡");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
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
