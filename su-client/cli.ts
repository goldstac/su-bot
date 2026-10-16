#!/usr/bin/env bun
import { Command } from "commander";

const BOT_URL = process.env.BOT_URL || "https://su-bot-t2a0.onrender.com";
const API_KEY = process.env.API_KEY || "su-bot-api-key";

// ─────────────────────────────────────────────
//  Pretty output helpers
// ─────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", gray: "\x1b[90m",
};

const ok = (msg: string) => console.log(`${c.green}✅ ${msg}${c.reset}`);
const fail = (msg: string) => console.error(`${c.red}❌ ${msg}${c.reset}`);
const info = (msg: string) => console.log(`${c.cyan}ℹ️  ${msg}${c.reset}`);
const warn = (msg: string) => console.log(`${c.yellow}⚠️  ${msg}${c.reset}`);
const head = (msg: string) => console.log(`\n${c.bold}${c.magenta}◆ ${msg}${c.reset}`);
const dim = (msg: string) => console.log(`${c.gray}  ${msg}${c.reset}`);

function formatUptime(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return [d && `${d}d`, (d || h) && `${h}h`, (d || h || m) && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}

async function api(path: string, method = "GET", body?: any) {
  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(`${BOT_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: API_KEY },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    fail(`Can't reach bot at ${BOT_URL}`);
    dim(`   ${err.message}`);
    dim(`   Is the bot running? Set BOT_URL to change the target.`);
    process.exit(1);
  }
  const latency = Date.now() - started;
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = { error: res.statusText };
  }
  if (!res.ok) {
    fail(`Error ${res.status}: ${data.error || res.statusText}`);
    process.exit(1);
  }
  return { data, latency };
}

// ─────────────────────────────────────────────
//  Program setup
// ─────────────────────────────────────────────
const program = new Command();

program
  .name("su")
  .description(`${c.magenta}SU Bot CLI${c.reset} — control your bot remotely\n\n  ${c.cyan}Target:${c.reset} ${BOT_URL}`)
  .version("2.0.0")
  .configureHelp({
    sortCommands: true,
    commandUsage: (cmd) => cmd.name() + " " + cmd.usage(),
  });

// ── Messaging ──
program
  .command("send")
  .description("Send a message to a channel")
  .argument("<channelId>", "Channel ID to send to")
  .argument("<message>", "Message content")
  .action(async (channelId, message) => {
    await api("/api/send", "POST", { channelId, content: message });
    ok(`Message sent to ${c.bold}${channelId}${c.reset}`);
  });

program
  .command("say")
  .description("Send a message (alias of send)")
  .argument("<channelId>", "Channel ID")
  .argument("<message>", "Message content")
  .action(async (channelId, message) => {
    await api("/api/send", "POST", { channelId, content: message });
    ok(`Message sent to ${c.bold}${channelId}${c.reset}`);
  });

// ── Status / activity ──
program
  .command("activity")
  .description("Set the bot's activity status")
  .argument("<text>", "Status text")
  .option("-t, --type <type>", "playing | streaming | listening | watching | competing", "playing")
  .action(async (text, opts) => {
    const types: Record<string, number> = { playing: 0, streaming: 1, listening: 2, watching: 3, competing: 5 };
    const type = types[opts.type];
    if (type === undefined) {
      fail(`Unknown type "${opts.type}". Use: playing, streaming, listening, watching, competing`);
      process.exit(1);
    }
    await api("/api/status", "POST", { status: text, type });
    ok(`Activity set: ${c.bold}${opts.type} ${text}${c.reset}`);
  });

// ── Bot status dashboard ──
program
  .command("botstatus")
  .alias("status")
  .description("Live bot status: uptime, latency, memory, features")
  .action(async () => {
    const { data, latency } = await api("/api/botstatus");
    const online = data.status === "online";
    head(`SU Bot v${data.version}`);
    console.log(
      `  ${online ? `${c.green}● ONLINE${c.reset}` : `${c.yellow}● MAINTENANCE${c.reset}`}` +
      (data.maintenanceReason ? ` — ${data.maintenanceReason}` : "")
    );
    dim("");
    dim(`${c.bold}Uptime${c.reset}     ${formatUptime(data.uptime)} (since ${new Date(data.startedAt).toLocaleString()})`);
    dim(`${c.bold}Latency${c.reset}    ${data.apiLatency}ms gateway • ${latency}ms API`);
    dim(`${c.bold}Memory${c.reset}     ${data.memoryMB} MB`);
    dim(`${c.bold}Guilds${c.reset}     ${data.guilds}`);
    dim(`${c.bold}Users${c.reset}      ${data.users}`);
    dim("");
    console.log(`  ${c.bold}Features (${data.features.length}):${c.reset}`);
    for (const f of data.features) {
      dim(`${f.emoji} ${c.bold}${f.name}${c.reset} — ${f.desc}`);
    }
    console.log();
  });

program
  .command("uptime")
  .description("Show bot uptime")
  .action(async () => {
    const { data } = await api("/health");
    ok(`Bot uptime: ${c.bold}${data.uptimeHuman || formatUptime(data.uptime)}${c.reset}`);
    dim(`Status: ${data.status} • Version: ${data.version || "?"}`);
  });

program
  .command("health")
  .description("Check bot health (public endpoint, no auth needed)")
  .action(async () => {
    const { data, latency } = await api("/health");
    const good = data.status === "ok";
    ok(`Bot is ${good ? `${c.green}healthy${c.reset}` : `${c.yellow}${data.status}${c.reset}`} | Uptime: ${c.bold}${data.uptimeHuman || formatUptime(data.uptime)}${c.reset} | ${latency}ms`);
  });

program
  .command("ping")
  .description("Measure API latency to the bot")
  .action(async () => {
    const { latency } = await api("/health");
    const bar = latency < 100 ? c.green : latency < 300 ? c.yellow : c.red;
    console.log(`\n  🏓 API latency: ${bar}${c.bold}${latency}ms${c.reset}\n`);
  });

// ── Maintenance mode ──
const maintenance = program.command("maintenance").description("Toggle maintenance mode");

maintenance
  .command("on")
  .description("Enable maintenance mode (blocks game commands)")
  .option("-r, --reason <reason>", "Reason shown to users", "Scheduled maintenance")
  .action(async (opts) => {
    const { data } = await api("/api/maintenance", "POST", { enabled: true, reason: opts.reason });
    warn(`Maintenance mode ${c.bold}ENABLED${c.reset}`);
    dim(`Reason: ${data.reason}`);
    dim(`Only status/help/ping commands work now.`);
  });

maintenance
  .command("off")
  .description("Disable maintenance mode")
  .action(async () => {
    await api("/api/maintenance", "POST", { enabled: false });
    ok(`Maintenance mode ${c.bold}DISABLED${c.reset} — all commands restored`);
  });

maintenance
  .command("get")
  .description("Check current maintenance status")
  .action(async () => {
    const { data } = await api("/api/botstatus");
    if (data.maintenance) {
      warn(`Maintenance is ON — "${data.maintenanceReason}"`);
    } else {
      ok(`Maintenance is OFF — bot is fully operational`);
    }
  });

// ── Features ──
const features = program.command("features").description("Manage the features list shown in changelogs");

features
  .command("list")
  .description("List all features")
  .action(async () => {
    const { data } = await api("/api/features");
    head(`Features (${data.features.length})`);
    for (const f of data.features) {
      dim(`${f.emoji} ${c.bold}${f.name}${c.reset} — ${f.desc}`);
    }
    console.log();
  });

features
  .command("add")
  .description("Add a feature to the list")
  .argument("<name>", "Feature name (e.g. 'Minigames')")
  .argument("[description]", "Feature description")
  .option("-e, --emoji <emoji>", "Feature emoji", "🆕")
  .action(async (name, desc, opts) => {
    const { data } = await api("/api/features", "POST", { action: "add", name, desc: desc || "", emoji: opts.emoji });
    ok(`Added feature: ${c.bold}${name}${c.reset}`);
    dim(`Now ${data.features.length} features total`);
  });

features
  .command("remove")
  .alias("rm")
  .description("Remove a feature from the list")
  .argument("<name>", "Feature name (or partial match)")
  .action(async (name) => {
    const { data } = await api("/api/features", "POST", { action: "remove", name });
    ok(`Removed feature: ${c.bold}${name}${c.reset}`);
    dim(`${data.features.length} features remaining`);
  });

// ── Servers ──
program
  .command("guilds")
  .description("List all servers the bot is in")
  .action(async () => {
    const { data } = await api("/api/guilds");
    if (data.guilds.length === 0) return info("No guilds found");
    head(`Guilds (${data.guilds.length})`);
    for (const g of data.guilds) {
      dim(`🏠 ${c.bold}${g.name}${c.reset} ${c.gray}(${g.id})${c.reset} — ${g.memberCount} members`);
    }
    console.log();
  });

program
  .command("channels")
  .description("List text channels in a server")
  .argument("<guildId>", "Server/Guild ID")
  .action(async (guildId) => {
    const { data } = await api(`/api/channels/${guildId}`);
    if (data.channels.length === 0) return info("No text channels found");
    head(`Channels`);
    for (const ch of data.channels) {
      dim(`#${c.bold}${ch.name}${c.reset} ${c.gray}(${ch.id})${c.reset}`);
    }
    console.log();
  });

program
  .command("nickname")
  .description("Set bot nickname in a server")
  .argument("<guildId>", "Server/Guild ID")
  .argument("[nickname]", "New nickname (empty to reset)")
  .action(async (guildId, nickname) => {
    await api("/api/nickname", "POST", { guildId, nickname: nickname || "" });
    ok(`Nickname updated${nickname ? ` to "${nickname}"` : " (reset)"}`);
  });

program.parse();
