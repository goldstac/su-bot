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
  "Time itself pauses for",
  "The stars align for",
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
  "fuses with",
  "channels the essence of",
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
  "Reality warps to their will.",
  "The cosmos trembles.",
];

const LARP_EVENTS = [
  { name: "CRITICAL HIT!", emoji: "💥", bonus: 2, desc: "The transformation was PERFECT" },
  { name: "EPIC FAIL", emoji: "🤡", bonus: 0, desc: "They tripped during the transformation" },
  { name: "COMBO x2!", emoji: "🔥", bonus: 3, desc: "Double the power!" },
  { name: "NATURAL 20!", emoji: "🎲", bonus: 5, desc: "Critical success!" },
  { name: "FUMBLE", emoji: "💨", bonus: -1, desc: "The transformation went wrong..." },
  { name: "LEGENDARY!", emoji: "⭐", bonus: 4, desc: "A once in a lifetime transformation!" },
  { name: "Cursed!", emoji: "💀", bonus: 1, desc: "They gained power but at a cost..." },
  { name: "BLESSED!", emoji: "✨", bonus: 3, desc: "The gods smile upon them" },
];

const LARP_RANKS = [
  { min: 0, rank: "LARP Noob", emoji: "👶" },
  { min: 500, rank: "LARP Beginner", emoji: "🌱" },
  { min: 1500, rank: "LARP Enjoyer", emoji: "😎" },
  { min: 3000, rank: "LARP Master", emoji: "🎭" },
  { min: 5000, rank: "LARP Legend", emoji: "👑" },
  { min: 10000, rank: "LARP GOD", emoji: "⚡" },
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
  chicken: ["🐔", "🍗", "🐓"],
  banana: ["🍌", "💛", "😂"],
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

const COLORS = [0x9900ff, 0xff0066, 0x00ff99, 0xffd700, 0x00aaff, 0xff6600, 0xff0000, 0x00ffff];

// Track user larp data (resets on restart)
const userLarpData = new Map<string, { total: number; streak: number; lastTarget: string; points: number }>();

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

function getRank(points: number) {
  let rank = LARP_RANKS[0];
  for (const r of LARP_RANKS) {
    if (points >= r.min) rank = r;
  }
  return rank;
}

function getUserData(userId: string) {
  if (!userLarpData.has(userId)) {
    userLarpData.set(userId, { total: 0, streak: 0, lastTarget: "", points: 0 });
  }
  return userLarpData.get(userId)!;
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
        },
        {
          name: "Events",
          value:
            "💥 Critical Hit | 🤡 Epic Fail | 🎲 Nat 20\n" +
            "🔥 Combo | ⭐ Legendary | ✨ Blessed",
        }
      )
      .setFooter({ text: "What do you want to become?" });

    await message.channel.send({ embeds: [embed] });
    return;
  }

  // Get user data
  const userData = getUserData(message.author.id);
  const isCombo = userData.lastTarget.toLowerCase() === target.toLowerCase();
  userData.total++;
  userData.lastTarget = target;

  // Handle streak
  if (isCombo) {
    userData.streak++;
  } else {
    userData.streak = 1;
  }

  // Roll for event (higher streak = higher chance)
  const eventChance = Math.min(0.3 + userData.streak * 0.1, 0.8);
  const hasEvent = Math.random() < eventChance;
  const event = hasEvent ? randomFrom(LARP_EVENTS) : null;

  // Calculate points
  const basePoints = Math.floor(Math.random() * 500) + 100;
  const streakBonus = userData.streak > 1 ? userData.streak * 50 : 0;
  const eventBonus = event ? event.bonus * 100 : 0;
  const totalPoints = basePoints + streakBonus + eventBonus;
  userData.points += totalPoints;

  const emojis = getEmojis(target);
  const emoji = randomFrom(emojis);
  const intro = randomFrom(LARP_INTROS);
  const action = randomFrom(LARP_ACTIONS);
  const outro = randomFrom(LARP_OUTROS);
  const powerData = randomFrom(LARP_POWER);
  const powerNum = Math.floor(Math.random() * 100) + 1;
  const danger = Math.floor(Math.random() * 10) + 1;
  const color = randomFrom(COLORS);
  const rank = getRank(userData.points);

  let description =
    `*${intro} **${message.author.username}**...*\n\n` +
    `### ${emoji} ${message.author.username} ${action} **${target}** ${emoji}\n\n` +
    `*${outro}*`;

  // Add event to description
  if (event) {
    description += `\n\n> ${event.emoji} **${event.name}** ${event.desc}`;
  }

  // Add streak info
  if (userData.streak > 1) {
    description += `\n> 🔥 **${userData.streak}x COMBO** - Keep going!`;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji}  ✦ TRANSFORMATION COMPLETE ✦  ${emoji}`)
    .setDescription(description)
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
        value: `**+${totalPoints}**\n*Total: ${userData.points}*`,
        inline: true,
      },
      {
        name: `${rank.emoji} Rank`,
        value: `**${rank.rank}**\n*${userData.total} total larps*`,
        inline: true,
      },
      {
        name: `🔥 Streak`,
        value: `**${userData.streak}x**\n*${isCombo ? "COMBO!" : "New combo started"}*`,
        inline: true,
      },
      {
        name: `🎯 Last Target`,
        value: `**${userData.lastTarget}**`,
        inline: true,
      }
    )
    .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 256 }))
    .setFooter({ text: `Transformed into ${target}` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
