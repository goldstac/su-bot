#!/usr/bin/env bun
import { Command } from "commander";

const BOT_URL = process.env.BOT_URL || "https://su-bot-t2a0.onrender.com";
const API_KEY = process.env.API_KEY || "su-bot-api-key";

async function api(path: string, method = "GET", body?: any) {
  const res = await fetch(`${BOT_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ Error: ${data.error || res.statusText}`);
    process.exit(1);
  }
  return data;
}

const program = new Command();

program
  .name("su")
  .description("SU Bot CLI - Control your bot remotely")
  .version("1.0.0");

program
  .command("send")
  .description("Send a message to a channel")
  .argument("<channelId>", "Channel ID to send to")
  .argument("<message>", "Message content")
  .action(async (channelId, message) => {
    await api("/api/send", "POST", { channelId, content: message });
    console.log(`✅ Message sent to ${channelId}`);
  });

program
  .command("status")
  .description("Set bot activity status")
  .argument("<text>", "Status text")
  .option("-t, --type <type>", "Activity type: playing, streaming, listening, watching, competing", "playing")
  .action(async (text, opts) => {
    const types: Record<string, number> = {
      playing: 0,
      streaming: 1,
      listening: 2,
      watching: 3,
      competing: 5,
    };
    const type = types[opts.type] ?? 0;
    await api("/api/status", "POST", { status: text, type });
    console.log(`✅ Status updated to: ${text}`);
  });

program
  .command("nickname")
  .description("Set bot nickname in a server")
  .argument("<guildId>", "Server/Guild ID")
  .argument("[nickname]", "New nickname (empty to reset)")
  .action(async (guildId, nickname) => {
    await api("/api/nickname", "POST", { guildId, nickname: nickname || "" });
    console.log(`✅ Nickname updated`);
  });

program
  .command("guilds")
  .description("List all servers the bot is in")
  .action(async () => {
    const data = await api("/api/guilds");
    if (data.guilds.length === 0) {
      console.log("No guilds found");
      return;
    }
    console.log(`\nGuilds (${data.guilds.length}):\n`);
    for (const g of data.guilds) {
      console.log(`  ${g.name} (${g.id}) - ${g.memberCount} members`);
    }
    console.log();
  });

program
  .command("channels")
  .description("List text channels in a server")
  .argument("<guildId>", "Server/Guild ID")
  .action(async (guildId) => {
    const data = await api(`/api/channels/${guildId}`);
    if (data.channels.length === 0) {
      console.log("No text channels found");
      return;
    }
    console.log(`\nChannels:\n`);
    for (const c of data.channels) {
      console.log(`  #${c.name} (${c.id})`);
    }
    console.log();
  });

program
  .command("health")
  .description("Check bot health")
  .action(async () => {
    const data = await api("/health");
    console.log(`✅ Bot is running | Uptime: ${Math.floor(data.uptime)}s`);
  });

program.parse();
