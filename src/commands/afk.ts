import { Message, EmbedBuilder } from "discord.js";

export interface AfkData {
  reason: string;
  timestamp: number;
}

export const afkUsers = new Map<string, AfkData>();

export async function handleAfk(message: Message, args: string[]): Promise<void> {
  const reason = args.join(" ") || "AFK";

  afkUsers.set(message.author.id, {
    reason,
    timestamp: Date.now(),
  });

  const embed = new EmbedBuilder()
    .setColor(0x9900ff)
    .setDescription(`⚡ **${message.author.username}** is now AFK`)
    .addFields({ name: "Reason", value: reason })
    .setFooter({ text: "You will be auto-removed when you send a message." });

  await message.channel.send({ embeds: [embed] });
}

export function checkAfkRemove(message: Message): void {
  if (afkUsers.has(message.author.id)) {
    afkUsers.delete(message.author.id);
  }
}

export async function checkAfkMention(message: Message): Promise<void> {
  for (const [, user] of message.mentions.users) {
    const afkData = afkUsers.get(user.id);
    if (afkData) {
      const elapsed = Math.floor((Date.now() - afkData.timestamp) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setDescription(`⚡ **${user.username}** is AFK`)
        .addFields(
          { name: "Reason", value: afkData.reason },
          { name: "Duration", value: timeStr }
        )
        .setThumbnail(user.displayAvatarURL({ extension: "png", size: 128 }));

      await message.channel.send({ embeds: [embed] });
    }
  }
}
