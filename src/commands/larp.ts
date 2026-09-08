import { Message, EmbedBuilder } from "discord.js";

const LARP_INTROS = [
  "A mystical aura surrounds",
  "Lightning crackles around",
  "Dark energy swirls near",
  "The ground trembles beneath",
  "A portal opens for",
  "The shadows embrace",
  "The fabric of reality bends for",
  "Ancient magic awakens for",
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
  cat: ["🐱", "😺", "😸"],
  dog: ["🐶", "🦴", "🐕"],
  default: ["🎭", "✨", "⚡", "🔥", "💀", "🗡️", "🛡️", "👑", "🌙", "🔮"],
};

const LARP_POWER = [
  { name: "Trash", color: "🟥" },
  { name: "Weak", color: "🟧" },
  { name: "Mid", color: "🟨" },
  { name: "Decent", color: "🟩" },
  { name: "Strong", color: "🟦" },
  { name: "Overpowered", color: "🟪" },
  { name: "Broken", color: "⬜" },
  { name: "Legendary", color: "🟧" },
  { name: "Mythic", color: "🟪" },
  { name: "GODLIKE", color: "🟥" },
];

const COLORS = [0x9900ff, 0xff0066, 0x00ff99, 0xffd700, 0x00aaff, 0xff6600];

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

function makeProgressBar(percent: number, length = 10): string {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return "`[" + "█".repeat(filled) + "░".repeat(empty) + "]`";
}

export async function handleLarp(message: Message, args: string[]): Promise<void> {
  const target = args.join(" ");

  if (!target) {
    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle("🎭 LARP MODE")
      .setDescription("Usage: `su!larp <something>`")
      .addFields(
        {
          name: "Examples",
          value:
            "`su!larp dragon`\n" +
            "`su!larp a wizard`\n" +
            "`su!larp literal god`\n" +
            "`su!larp mistake`",
        },
        {
          name: "Special Targets",
          value:
            "🐉 dragon | 🧙 wizard | ⚔️ knight\n" +
            "⚡ god | 😈 demon | 🥷 ninja\n" +
            "🏴‍☠️ pirate | 🤖 robot | 🐱 cat | 🐶 dog",
        }
      )
      .setFooter({ text: "What do you want to become?" });

    await message.channel.send({ embeds: [embed] });
    return;
  }

  const emojis = getEmojis(target);
  const emoji = randomFrom(emojis);
  const intro = randomFrom(LARP_INTROS);
  const action = randomFrom(LARP_ACTIONS);
  const outro = randomFrom(LARP_OUTROS);
  const powerData = randomFrom(LARP_POWER);
  const powerNum = Math.floor(Math.random() * 100) + 1;
  const danger = Math.floor(Math.random() * 10) + 1;
  const larpPoints = Math.floor(Math.random() * 500) + 100;
  const color = randomFrom(COLORS);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji}  ✦ TRANSFORMATION COMPLETE ✦  ${emoji}`)
    .setDescription(
      `*${intro} **${message.author.username}**...*\n\n` +
      `### ${emoji} ${message.author.username} ${action} **${target}** ${emoji}\n\n` +
      `*${outro}*`
    )
    .addFields(
      {
        name: `${powerData.color} Power Level`,
        value: `**${powerData.name}**\n${makeProgressBar(powerNum)} **${powerNum}**/100`,
        inline: true,
      },
      {
        name: `⚠️ Danger Level`,
        value: `**${danger}/10**\n${"🔴".repeat(danger)}${"⚫".repeat(10 - danger)}`,
        inline: true,
      },
      {
        name: `✨ LARP Points`,
        value: `**+${larpPoints}**\n*earned*`,
        inline: true,
      }
    )
    .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 256 }))
    .setImage("attachment://larp.png")
    .setFooter({ text: `Transformed into ${target}` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
