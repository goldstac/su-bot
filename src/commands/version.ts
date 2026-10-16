import { Message, EmbedBuilder } from "discord.js";
import { VERSION, uptimeString } from "../state";

export async function handleVersion(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x00aaff)
    .setTitle("⚡ SU Bot")
    .setDescription(`Version: **${VERSION}**\nUptime: **${uptimeString()}**`)
    .setFooter({ text: "Powered by Li Productions ⚡" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
