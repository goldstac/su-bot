import { Message, EmbedBuilder } from "discord.js";

export async function handleCredits(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x9900ff)
    .setTitle("⚡ Credits")
    .setDescription("Made with raw power by **Li Productions**")
    .addFields({ name: "Repo", value: "[github.com/goldstac/su-bot](https://github.com/goldstac/su-bot)" })
    .setFooter({ text: "SU Bot v1.0" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
