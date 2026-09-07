import { Message, EmbedBuilder } from "discord.js";

const VERSION = "1.0.0";

export async function handleVersion(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x00aaff)
    .setTitle("⚡ SU Bot")
    .setDescription(`Version: **${VERSION}**`)
    .setFooter({ text: "Powered by Li Productions ⚡" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
