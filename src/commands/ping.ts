import { Message, EmbedBuilder } from "discord.js";

export async function handlePing(message: Message): Promise<void> {
  const latency = Date.now() - message.createdTimestamp;
  const apiLatency = Math.round(message.client.ws.ping);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("⚡ Pong!")
    .addFields(
      { name: "Bot Latency", value: `${latency}ms`, inline: true },
      { name: "API Latency", value: `${apiLatency}ms`, inline: true }
    )
    .setFooter({ text: "System operational." });

  await message.channel.send({ embeds: [embed] });
}
