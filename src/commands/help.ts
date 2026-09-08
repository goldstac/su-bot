import { Message, EmbedBuilder } from "discord.js";

export async function handleHelp(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("⚡ SU Bot Commands")
    .setDescription("All commands use the prefix `su!`")
    .addFields(
      { name: "su!smite @user", value: "Smite a user with animated lightning" },
      { name: "su!smite @user ?r reason", value: "Smite with a custom reason" },
      { name: "su!smite.larp @user", value: "LARP TERMINATION - Extra deadly smite" },
      { name: "su!afk [reason]", value: "Set yourself as AFK" },
      { name: "su!larp <something>", value: "Larp as something" },
      { name: "su!larp help", value: "View full LARP system" },
      { name: "su!ping", value: "Check bot and API latency" },
      { name: "su!version", value: "Show bot version" },
      { name: "su!credits", value: "Show credits" },
      { name: "su!help", value: "Show this message" }
    )
    .setFooter({ text: "SU Bot v2.0 | Li Productions ⚡" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
