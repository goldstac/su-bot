import { Message, EmbedBuilder } from "discord.js";
import { botState, uptimeString, VERSION } from "../state";

// ─────────────────────────────────────────────
//  su!botstatus - live bot status dashboard
// ─────────────────────────────────────────────
export async function handleBotStatus(message: Message): Promise<void> {
  const client = message.client;
  const apiLatency = Math.round(client.ws.ping);
  const mem = process.memoryUsage();
  const memMB = (mem.heapUsed / 1024 / 1024).toFixed(1);

  const latencyColor = apiLatency < 100 ? 0x00ff00 : apiLatency < 250 ? 0xffff00 : 0xff0000;
  const color = botState.maintenance ? 0xff9900 : latencyColor;

  const featuresList = botState.features.length
    ? botState.features.map((f) => `${f.emoji} **${f.name}** — ${f.desc}`).join("\n")
    : "*No features registered*";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`⚡ SU Bot Status — v${VERSION}`)
    .setDescription(
      botState.maintenance
        ? `🔧 **MAINTENANCE MODE ACTIVE**\n> ${botState.maintenanceReason || "Under maintenance"}`
        : "✅ **All systems operational**"
    )
    .addFields(
      { name: "⏱️ Uptime", value: `**${uptimeString()}**`, inline: true },
      { name: "📡 API Latency", value: `**${apiLatency}ms**`, inline: true },
      { name: "🧠 Memory", value: `**${memMB} MB**`, inline: true },
      { name: "🏠 Servers", value: `**${client.guilds.cache.size}**`, inline: true },
      { name: "👥 Users", value: `**${client.users.cache.size}**`, inline: true },
      { name: "🟢 Status", value: botState.maintenance ? "🔧 Maintenance" : "🟢 Online", inline: true },
      { name: `✨ Features (${botState.features.length})`, value: featuresList }
    )
    .setThumbnail(client.user?.displayAvatarURL({ extension: "png", size: 256 }) || null)
    .setFooter({ text: "SU Bot • Li Productions" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  su!changelog - show the latest features
// ─────────────────────────────────────────────
export async function handleChangeLog(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x9900ff)
    .setTitle(`✨ What's New — SU Bot v${VERSION}`)
    .setDescription("Fresh features, hot off the terminal.")
    .addFields(
      ...botState.features.map((f) => ({
        name: `${f.emoji} ${f.name}`,
        value: f.desc,
        inline: false,
      }))
    )
    .setFooter({ text: "Use su!botstatus for live uptime & health" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
