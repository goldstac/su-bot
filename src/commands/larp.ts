import { Message, EmbedBuilder } from "discord.js";

const LARP_INTROS = [
  "A mystical aura surrounds",
  "Lightning crackles around",
  "Dark energy swirls near",
  "The ground trembles beneath",
  "A portal opens for",
  "The shadows embrace",
];

const LARP_ACTIONS = [
  "transforms into",
  "shapeshifts into",
  "morphs into",
  "reveals themselves as",
  "becomes",
  "assumes the form of",
  "evolves into",
  "metamorphosizes into",
];

const LARP_OUTROS = [
  "The transformation is complete.",
  "Power courses through their veins.",
  "They feel unstoppable.",
  "The other mortals tremble.",
  "A new era begins.",
  "Legends will speak of this.",
  "Nobody saw this coming.",
  "The universe shifts.",
];

const LARP_EMOJIS: Record<string, string[]> = {
  dragon: ["🐉", "🔥", "💀"],
  wizard: ["🧙", "✨", "🔮"],
  knight: ["⚔️", "🛡️", "🏰"],
  god: ["⚡", "👑", "🌟"],
  demon: ["😈", "🔥", "💀"],
  ninja: ["🥷", "🗡️", "🌑"],
  pirate: ["🏴‍☠️", "⚓", "🗡️"],
  robot: ["🤖", "⚙️", "🔧"],
  default: ["🎭", "✨", "⚡", "🔥", "💀", "🗡️", "🛡️", "👑", "🌙", "🔮"],
};

const LARP_POWER = [
  "Trash", "Weak", "Mid", "Decent", "Strong",
  "Overpowered", "Broken", "Legendary", "Mythic", "GODLIKE"
];

function getEmojis(target: string): string[] {
  const lower = target.toLowerCase();
  for (const [key, emojis] of Object.entries(LARP_EMOJIS)) {
    if (key !== "default" && lower.includes(key)) return emojis;
  }
  return LARP_EMOJIS.default;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function handleLarp(message: Message, args: string[]): Promise<void> {
  const target = args.join(" ");

  if (!target) {
    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setDescription("⚡ Usage: `su!larp <something>`")
      .addFields(
        { name: "Examples", value: "`su!larp dragon`\n`su!larp a wizard`\n`su!larp literal god`" }
      )
      .setFooter({ text: "What do you want to larp as?" });

    await message.channel.send({ embeds: [embed] });
    return;
  }

  const emojis = getEmojis(target);
  const emoji = randomFrom(emojis);
  const intro = randomFrom(LARP_INTROS);
  const action = randomFrom(LARP_ACTIONS);
  const outro = randomFrom(LARP_OUTROS);
  const power = randomFrom(LARP_POWER);
  const powerNum = Math.floor(Math.random() * 100) + 1;
  const danger = Math.floor(Math.random() * 10) + 1;

  const embed = new EmbedBuilder()
    .setColor(0x9900ff)
    .setTitle(`${emoji} LARP MODE ACTIVATED ${emoji}`)
    .setDescription(
      `${intro} **${message.author.username}**...\n\n` +
      `> ${emoji} **${message.author.username}** ${action} **${target}** ${emoji}\n\n` +
      `*${outro}*`
    )
    .addFields(
      { name: "Power Level", value: `${power} (${powerNum}/100)`, inline: true },
      { name: "Danger Level", value: `${"⚠️".repeat(Math.min(danger, 10))} ${danger}/10`, inline: true },
      { name: "LARP Points", value: `+${Math.floor(Math.random() * 500) + 100}`, inline: true }
    )
    .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 128 }))
    .setFooter({ text: `${message.author.username} is now ${target}` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
