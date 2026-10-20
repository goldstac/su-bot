import { Message, EmbedBuilder } from "discord.js";
import { VERSION } from "../state";

export async function handleHelp(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("⚡ SU Bot Commands")
    .setDescription("All commands use the prefix `su!`")
    .addFields(
      { name: "⚡ Combat", value: "`su!smite @user` — Smite with animated lightning\n`su!smite @user ?r reason` — Custom reason\n`su!smite.larp @user` — Extra deadly LARP termination", inline: false },
      { name: "🎭 LARP System", value: "`su!larp <something>` — Larp as something\n`su!larp help` — Full LARP system (classes, skills, battles)", inline: false },
      { name: "🎰 Minigames", value: "`su!games` — All minigames (slots, coinflip, dice, trivia, rps & more)\n`su!work` — Earn free points every 30 min\n`su!games balance` — Check your wallet", inline: false },
      { name: "🎧 Quran & Nasheeds", value: "`su!track` — What you are listening to right now\n`su!track link` — Connect the Quran app\n`su!fm` — How many times you listened to what\n`su!fm recent` — Your last plays", inline: false },
      { name: "📊 Bot Info", value: "`su!botstatus` — Live status: uptime, latency, features\n`su!changelog` — What's new\n`su!uptime` — Bot uptime\n`su!ping` — Latency check\n`su!version` — Bot version", inline: false },
      { name: "💤 Utility", value: "`su!afk [reason]` — Set yourself AFK\n`su!credits` — Show credits\n`su!help` — This message", inline: false }
    )
    .setFooter({ text: `SU Bot v${VERSION} | Li Productions ⚡` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
