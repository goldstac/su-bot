import { Message, EmbedBuilder } from "discord.js";

const LARP_ACTIONS = [
  "is now",
  "has become",
  "transforms into",
  "shapeshifts into",
  "appears as",
  "reveals themselves as",
];

const LARP_EMOJIS = ["🎭", "✨", "⚡", "🔥", "💀", "🗡️", "🛡️", "👑"];

export async function handleLarp(message: Message, args: string[]): Promise<void> {
  const target = args.join(" ");

  if (!target) {
    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setDescription("⚡ Usage: `su!larp <something>`")
      .setFooter({ text: "What do you want to larp as?" });

    await message.channel.send({ embeds: [embed] });
    return;
  }

  const action = LARP_ACTIONS[Math.floor(Math.random() * LARP_ACTIONS.length)];
  const emoji = LARP_EMOJIS[Math.floor(Math.random() * LARP_EMOJIS.length)];

  const embed = new EmbedBuilder()
    .setColor(0x9900ff)
    .setDescription(`${emoji} **${message.author.username}** ${action} **${target}**`)
    .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 128 }))
    .setFooter({ text: "LARP mode activated" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
