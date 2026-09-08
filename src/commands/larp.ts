import { Message, EmbedBuilder } from "discord.js";

// ─────────────────────────────────────────────
//  LARP DATABASE (resets on restart)
// ─────────────────────────────────────────────
interface LarpUserData {
  total: number;
  streak: number;
  lastTarget: string;
  points: number;
  xp: number;
  level: number;
  class: string | null;
  achievements: string[];
  skills: Record<string, number>;
  items: string[];
  battleWins: number;
  battleLosses: number;
  dailyStreak: number;
  lastDaily: number;
}

const userData = new Map<string, LarpUserData>();

function getUser(userId: string): LarpUserData {
  if (!userData.has(userId)) {
    userData.set(userId, {
      total: 0, streak: 0, lastTarget: "", points: 0, xp: 0,
      level: 1, class: null, achievements: [], skills: {},
      items: [], battleWins: 0, battleLosses: 0, dailyStreak: 0, lastDaily: 0,
    });
  }
  return userData.get(userId)!;
}

// ─────────────────────────────────────────────
//  LARP CLASSES
// ─────────────────────────────────────────────
const LARP_CLASSES = [
  { id: "warrior", name: "Warrior", emoji: "⚔️", bonus: "power", desc: "+20% power rolls" },
  { id: "mage", name: "Mage", emoji: "🧙", bonus: "points", desc: "+30% LARP points" },
  { id: "rogue", name: "Rogue", emoji: "🗡️", bonus: "events", desc: "+40% event chance" },
  { id: "paladin", name: "Paladin", emoji: "🛡️", bonus: "streak", desc: "+50% streak bonus" },
  { id: "necromancer", name: "Necromancer", emoji: "💀", bonus: "danger", desc: "Max danger always" },
  { id: "bard", name: "Bard", emoji: "🎵", bonus: "combo", desc: "2x combo multiplier" },
];

// ─────────────────────────────────────────────
//  LARP ACHIEVEMENTS
// ─────────────────────────────────────────────
const LARP_ACHIEVEMENTS = [
  { id: "first_larp", name: "First Steps", emoji: "👶", desc: "Complete your first LARP", check: (u: LarpUserData) => u.total >= 1 },
  { id: "larp_10", name: "Getting Started", emoji: "🌱", desc: "Complete 10 LARPs", check: (u: LarpUserData) => u.total >= 10 },
  { id: "larp_50", name: "LARP Veteran", emoji: "🏅", desc: "Complete 50 LARPs", check: (u: LarpUserData) => u.total >= 50 },
  { id: "larp_100", name: "LARP Master", emoji: "🏆", desc: "Complete 100 LARPs", check: (u: LarpUserData) => u.total >= 100 },
  { id: "larp_500", name: "LARP Legend", emoji: "👑", desc: "Complete 500 LARPs", check: (u: LarpUserData) => u.total >= 500 },
  { id: "combo_5", name: "Combo King", emoji: "🔥", desc: "5x Combo streak", check: (u: LarpUserData) => u.streak >= 5 },
  { id: "combo_10", name: "Combo God", emoji: "💥", desc: "10x Combo streak", check: (u: LarpUserData) => u.streak >= 10 },
  { id: "points_1k", name: "Point Collector", emoji: "💰", desc: "Earn 1,000 points", check: (u: LarpUserData) => u.points >= 1000 },
  { id: "points_10k", name: "Point Hoarder", emoji: "💎", desc: "Earn 10,000 points", check: (u: LarpUserData) => u.points >= 10000 },
  { id: "points_100k", name: "Point God", emoji: "⚡", desc: "Earn 100,000 points", check: (u: LarpUserData) => u.points >= 100000 },
  { id: "level_10", name: "Rising Star", emoji: "⭐", desc: "Reach level 10", check: (u: LarpUserData) => u.level >= 10 },
  { id: "level_25", name: "Power House", emoji: "🌟", desc: "Reach level 25", check: (u: LarpUserData) => u.level >= 25 },
  { id: "level_50", name: "Ascended", emoji: "✨", desc: "Reach level 50", check: (u: LarpUserData) => u.level >= 50 },
  { id: "class_pick", name: "Class Chosen", emoji: "🎯", desc: "Choose a LARP class", check: (u: LarpUserData) => u.class !== null },
  { id: "all_targets", name: "Variety Pack", emoji: "🌈", desc: "LARP 10 different targets", check: () => false },
  { id: "daily_7", name: "Dedicated LARPer", emoji: "📅", desc: "7 day daily streak", check: (u: LarpUserData) => u.dailyStreak >= 7 },
  { id: "battle_win", name: "First Blood", emoji: "🩸", desc: "Win your first LARP battle", check: (u: LarpUserData) => u.battleWins >= 1 },
  { id: "battle_10", name: "War Machine", emoji: "⚔️", desc: "Win 10 LARP battles", check: (u: LarpUserData) => u.battleWins >= 10 },
];

// ─────────────────────────────────────────────
//  LARP SKILLS
// ─────────────────────────────────────────────
const LARP_SKILLS = [
  { id: "power", name: "Power", emoji: "💪", desc: "Increases power rolls", max: 10 },
  { id: "luck", name: "Luck", emoji: "🍀", desc: "Better event chances", max: 10 },
  { id: "charisma", name: "Charisma", emoji: "🗣️", desc: "More points from combos", max: 10 },
  { id: "endurance", name: "Endurance", emoji: "🏋️", desc: "Longer streaks", max: 10 },
  { id: "mysticism", name: "Mysticism", emoji: "🔮", desc: "Rare events", max: 10 },
];

// ─────────────────────────────────────────────
//  LARP ITEMS
// ─────────────────────────────────────────────
const LARP_ITEMS = [
  { id: "sword", name: "LARP Sword", emoji: "⚔️", desc: "+10% power", bonus: "power" },
  { id: "shield", name: "LARP Shield", emoji: "🛡️", desc: "+10% streak", bonus: "streak" },
  { id: "crown", name: "LARP Crown", emoji: "👑", desc: "+20% points", bonus: "points" },
  { id: "potion", name: "LARP Potion", emoji: "🧪", desc: "+1 level", bonus: "level" },
  { id: "scroll", name: "Ancient Scroll", emoji: "📜", desc: "+5% all stats", bonus: "all" },
  { id: "amulet", name: "Mystic Amulet", emoji: "📿", desc: "Rare events", bonus: "events" },
  { id: "ring", name: "Power Ring", emoji: "💍", desc: "+15% power", bonus: "power" },
  { id: "cape", name: "Hero Cape", emoji: "🦸", desc: "+25% streak", bonus: "streak" },
];

// ─────────────────────────────────────────────
//  LARP DATA
// ─────────────────────────────────────────────
const LARP_INTROS = [
  "A mystical aura surrounds", "Lightning crackles around",
  "Dark energy swirls near", "The ground trembles beneath",
  "A portal opens for", "The shadows embrace",
  "The fabric of reality bends for", "Ancient magic awakens for",
  "Time itself pauses for", "The stars align for",
  "The heavens open for", "A divine light shines on",
];

const LARP_ACTIONS = [
  "transforms into", "shapeshifts into", "morphs into",
  "reveals themselves as", "becomes", "assumes the form of",
  "evolves into", "metamorphosizes into", "fuses with",
  "channels the essence of", "awakens as", "emerges as",
];

const LARP_OUTROS = [
  "The transformation is complete.", "Power courses through their veins.",
  "They feel unstoppable.", "The other mortals tremble.",
  "A new era begins.", "Legends will speak of this.",
  "Nobody saw this coming.", "The universe shifts.",
  "Reality warps to their will.", "The cosmos trembles.",
  "Time bends to their will.", "The multiverse acknowledges them.",
];

const LARP_EVENTS = [
  { name: "CRITICAL HIT!", emoji: "💥", bonus: 2, desc: "The transformation was PERFECT", rarity: "common" },
  { name: "EPIC FAIL", emoji: "🤡", bonus: 0, desc: "They tripped during the transformation", rarity: "common" },
  { name: "COMBO x2!", emoji: "🔥", bonus: 3, desc: "Double the power!", rarity: "common" },
  { name: "NATURAL 20!", emoji: "🎲", bonus: 5, desc: "Critical success!", rarity: "rare" },
  { name: "FUMBLE", emoji: "💨", bonus: -1, desc: "The transformation went wrong...", rarity: "common" },
  { name: "LEGENDARY!", emoji: "⭐", bonus: 4, desc: "A once in a lifetime transformation!", rarity: "rare" },
  { name: "Cursed!", emoji: "💀", bonus: 1, desc: "They gained power but at a cost...", rarity: "uncommon" },
  { name: "BLESSED!", emoji: "✨", bonus: 3, desc: "The gods smile upon them", rarity: "uncommon" },
  { name: "GODLIKE!", emoji: "⚡", bonus: 6, desc: "They have transcended mortality", rarity: "legendary" },
  { name: "TIME WARP!", emoji: "⏰", bonus: 4, desc: "Time itself bends to their will", rarity: "rare" },
  { name: "SHINY!", emoji: "🌟", bonus: 3, desc: "A rare shiny transformation!", rarity: "rare" },
  { name: "MEGA EVOLUTION!", emoji: "🔴", bonus: 5, desc: "They have mega evolved!", rarity: "legendary" },
  { name: "CRITICAL MISS!", emoji: "😱", bonus: -2, desc: "They turned into a potato", rarity: "uncommon" },
  { name: "DOUBLE TROUBLE!", emoji: "👥", bonus: 4, desc: "Two of them now!", rarity: "rare" },
  { name: "GOLDEN!", emoji: "🥇", bonus: 5, desc: "A golden transformation!", rarity: "legendary" },
  { name: "FUSION!", emoji: "🔗", bonus: 4, desc: "They fused with another entity!", rarity: "rare" },
];

// DEADLY JOB EVENTS
const LARP_JOB_EVENTS = [
  { name: "HIRED!", emoji: "💼", bonus: 3, desc: "They got the job... but at what cost?", rarity: "common", jobs: ["job", "job application", "ceo", "intern", "manager"] },
  { name: "FIRED!", emoji: "🔥", bonus: -2, desc: "They got fired on the first day", rarity: "common", jobs: ["job", "job application", "ceo", "intern", "manager", "accountant"] },
  { name: "PROMOTED!", emoji: "📈", bonus: 5, desc: "Employee of the month!", rarity: "rare", jobs: ["job", "ceo", "manager", "engineer"] },
  { name: "LAWSUIT!", emoji: "⚖️", bonus: 4, desc: "They're suing everyone", rarity: "rare", jobs: ["lawyer", "doctor", "engineer", "programmer"] },
  { name: "OVERTIME!", emoji: "⏰", bonus: 2, desc: "72 hours straight. No sleep. Only work.", rarity: "uncommon", jobs: ["programmer", "engineer", "doctor", "chef"] },
  { name: "KAREN DETECTED!", emoji: "💳", bonus: 6, desc: "I WANT TO SPEAK TO THE MANAGER", rarity: "legendary", jobs: ["Karen", "retail", "waiter"] },
  { name: "MINIMUM WAGE!", emoji: "💵", bonus: 0, desc: "$7.25/hour. Dreams shattered.", rarity: "common", jobs: ["retail", "waiter", "intern", "chef"] },
  { name: "CORPORATE MERGE!", emoji: "🏢", bonus: 4, desc: "The company merged. Nobody knows what they do now.", rarity: "rare", jobs: ["ceo", "manager", "accountant", "lawyer"] },
  { name: "COFFEE SPILL!", emoji: "☕", bonus: -1, desc: "Destroyed the entire server room", rarity: "common", jobs: ["programmer", "engineer", "intern"] },
  { name: "SYNERGY!", emoji: "🤝", bonus: 5, desc: "They synergized so hard the building shook", rarity: "legendary", jobs: ["ceo", "manager", "lawyer"] },
  { name: "RESTRUCTURING!", emoji: "📊", bonus: 3, desc: "Your department no longer exists", rarity: "uncommon", jobs: ["job", "ceo", "manager", "accountant"] },
  { name: "REMOTE WORK!", emoji: "🏠", bonus: 4, desc: "Working from home in pajamas. Power move.", rarity: "rare", jobs: ["programmer", "engineer", "manager"] },
  { name: "BILLABLE HOURS!", emoji: "💰", bonus: 5, desc: "$500/hour and they charge for breathing", rarity: "legendary", jobs: ["lawyer", "doctor", "engineer"] },
  { name: "DEADLINE CRUNCH!", emoji: "📉", bonus: 2, desc: "Due yesterday. Panic mode activated.", rarity: "uncommon", jobs: ["programmer", "engineer", "chef", "designer"] },
  { name: "EMAIL CHAIN!", emoji: "📧", bonus: -1, desc: "Reply all. 47 messages. None of them useful.", rarity: "common", jobs: ["job", "ceo", "manager", "accountant"] },
  { name: "REVENUE STREAM!", emoji: "💸", bonus: 6, desc: "Money is flowing. They are unstoppable.", rarity: "legendary", jobs: ["ceo", "manager", "lawyer", "accountant"] },
];

const LARP_EMOJIS: Record<string, string[]> = {
  dragon: ["🐉", "🔥", "💀"], wizard: ["🧙", "✨", "🔮"],
  knight: ["⚔️", "🛡️", "🏰"], god: ["⚡", "👑", "🌟"],
  demon: ["😈", "🔥", "💀"], ninja: ["🥷", "🗡️", "🌑"],
  pirate: ["🏴‍☠️", "⚓", "🗡️"], robot: ["🤖", "⚙️", "🔧"],
  cat: ["🐱", "😺", "😸"], dog: ["🐶", "🦴", "🐕"],
  chicken: ["🐔", "🍗", "🐓"], banana: ["🍌", "💛", "😂"],
  potato: ["🥔", "😂", "💀"], spoon: ["🥄", "✨", "🫠"],
  // DEADLY JOBS
  job: ["💼", "📊", "💰", "🔪", "💀"], "job application": ["📋", "💼", "✍️", "💀", "⚰️"],
  ceo: ["💼", "💰", "🏦", "🗡️", "💀"], intern: ["📎", "☕", "📋", "😭", "💀"],
  manager: ["👔", "📊", "💼", "🔪", "💀"], accountant: ["🔢", "💰", "📊", "💀", "⚰️"],
  lawyer: ["⚖️", "📜", "💼", "🗡️", "💀"], doctor: ["💉", "🩺", "🏥", "💀", "⚰️"],
  engineer: ["⚙️", "🔧", "💻", "💀", "⚰️"], programmer: ["💻", "🐛", "☕", "💀", "⚰️"],
  chef: ["👨‍🍳", "🔪", "🍳", "💀", "☠️"], waiter: ["🍽️", "😤", "📋", "💀", "⚰️"],
  retail: ["🛒", "😤", "💀", "😭", "⚰️"], Karen: ["💳", "Manager", "📱", "💀", "☠️"],
  default: ["🎭", "✨", "⚡", "🔥", "💀", "🗡️", "🛡️", "👑", "🌙", "🔮"],
};

const LARP_POWER = [
  { name: "Trash", color: "🟥" }, { name: "Weak", color: "🟧" },
  { name: "Mid", color: "🟨" }, { name: "Decent", color: "🟩" },
  { name: "Strong", color: "🟦" }, { name: "Overpowered", color: "🟪" },
  { name: "Broken", color: "⬜" }, { name: "Legendary", color: "🟧" },
  { name: "Mythic", color: "🟪" }, { name: "GODLIKE", color: "🟥" },
];

const LARP_RANKS = [
  { min: 0, rank: "LARP Noob", emoji: "👶", color: 0x808080 },
  { min: 500, rank: "LARP Beginner", emoji: "🌱", color: 0x00ff00 },
  { min: 1500, rank: "LARP Enjoyer", emoji: "😎", color: 0x00aaff },
  { min: 3000, rank: "LARP Master", emoji: "🎭", color: 0x9900ff },
  { min: 5000, rank: "LARP Legend", emoji: "👑", color: 0xffd700 },
  { min: 10000, rank: "LARP GOD", emoji: "⚡", color: 0xff0066 },
  { min: 25000, rank: "LARP DEITY", emoji: "🔱", color: 0xff0000 },
  { min: 50000, rank: "LARP COSMIC ENTITY", emoji: "🌌", color: 0x00ffff },
];

const COLORS = [0x9900ff, 0xff0066, 0x00ff99, 0xffd700, 0x00aaff, 0xff6600, 0xff0000, 0x00ffff, 0xff00ff, 0xffff00];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
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
  return "`[" + "█".repeat(filled) + "░".repeat(length - filled) + "]`";
}

function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function getRank(points: number) {
  let rank = LARP_RANKS[0];
  for (const r of LARP_RANKS) {
    if (points >= r.min) rank = r;
  }
  return rank;
}

function checkAchievements(user: LarpUserData): string[] {
  const newAchievements: string[] = [];
  for (const ach of LARP_ACHIEVEMENTS) {
    if (!user.achievements.includes(ach.id) && ach.check(user)) {
      user.achievements.push(ach.id);
      newAchievements.push(`${ach.emoji} **${ach.name}** - ${ach.desc}`);
    }
  }
  return newAchievements;
}

// ─────────────────────────────────────────────
//  MAIN LARP COMMAND
// ─────────────────────────────────────────────
export async function handleLarp(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const user = getUser(message.author.id);

  // ── SUBCOMMANDS ──
  if (sub === "help") return showLarpHelp(message);
  if (sub === "profile" || sub === "stats") return showProfile(message, user);
  if (sub === "class") return showClassSelect(message, user, args.slice(1));
  if (sub === "skills") return showSkills(message, user, args.slice(1));
  if (sub === "inventory" || sub === "inv") return showInventory(message, user);
  if (sub === "achievements" || sub === "achs") return showAchievements(message, user);
  if (sub === "daily") return claimDaily(message, user);
  if (sub === "battle") return startBattle(message, user, args.slice(1));
  if (sub === "leaderboard" || sub === "lb") return showLeaderboard(message);
  if (sub === "shop") return showShop(message, user);
  if (sub === "buy") return buyItem(message, user, args.slice(1));

  // ── MAIN LARP ──
  const target = args.join(" ");
  if (!target) return showLarpHelp(message);

  const isCombo = user.lastTarget.toLowerCase() === target.toLowerCase();
  user.total++;
  user.lastTarget = target;
  user.streak = isCombo ? user.streak + 1 : 1;

  // Calculate bonuses from class and items
  let powerBonus = 0, pointBonus = 0, eventBonus = 0, streakBonusMult = 1;
  if (user.class === "warrior") powerBonus = 0.2;
  if (user.class === "mage") pointBonus = 0.3;
  if (user.class === "rogue") eventBonus = 0.4;
  if (user.class === "paladin") streakBonusMult = 1.5;
  if (user.class === "bard") streakBonusMult = 2;

  for (const itemId of user.items) {
    const item = LARP_ITEMS.find(i => i.id === itemId);
    if (item?.bonus === "power") powerBonus += 0.1;
    if (item?.bonus === "streak") streakBonusMult += 0.1;
    if (item?.bonus === "points") pointBonus += 0.2;
  }

  // Roll for event
  const baseEventChance = 0.3 + user.streak * 0.05;
  const totalEventChance = Math.min(baseEventChance + eventBonus, 0.9);
  const hasEvent = Math.random() < totalEventChance;

  // Check if this is a job-related larp
  const jobKeywords = ["job", "job application", "ceo", "intern", "manager", "accountant", "lawyer", "doctor", "engineer", "programmer", "chef", "waiter", "retail", "karen"];
  const isJobLarp = jobKeywords.some(k => target.toLowerCase().includes(k));

  let event = null;
  if (hasEvent) {
    const roll = Math.random();
    // Mix in job events for job larps
    let pool = isJobLarp ? [...LARP_EVENTS, ...LARP_JOB_EVENTS.filter(e => e.jobs.some(j => target.toLowerCase().includes(j)))] : LARP_EVENTS;
    if (user.skills.mysticism) pool = pool.filter(e => e.rarity !== "legendary" || Math.random() < 0.1 * user.skills.mysticism);
    if (roll < 0.5) pool = pool.filter(e => e.rarity === "common");
    else if (roll < 0.8) pool = pool.filter(e => e.rarity === "uncommon");
    else if (roll < 0.95) pool = pool.filter(e => e.rarity === "rare");
    else pool = pool.filter(e => e.rarity === "legendary");
    event = pool.length ? randomFrom(pool) : randomFrom(LARP_EVENTS);
  }

  // Calculate points
  const basePoints = Math.floor(Math.random() * 500) + 100;
  const streakPts = user.streak > 1 ? user.streak * 50 * streakBonusMult : 0;
  const eventPts = event ? event.bonus * 100 : 0;
  const totalPoints = Math.floor((basePoints + streakPts + eventPts) * (1 + pointBonus));
  user.points += totalPoints;
  user.xp += Math.floor(totalPoints / 10);

  // Level up check
  let leveledUp = false;
  while (user.xp >= getXpForLevel(user.level)) {
    user.xp -= getXpForLevel(user.level);
    user.level++;
    leveledUp = true;
  }

  // Check achievements
  const newAchievements = checkAchievements(user);

  // Build embed
  const emojis = getEmojis(target);
  const emoji = randomFrom(emojis);
  const intro = randomFrom(LARP_INTROS);
  const action = randomFrom(LARP_ACTIONS);
  const outro = randomFrom(LARP_OUTROS);
  const powerData = randomFrom(LARP_POWER);
  const powerNum = Math.min(100, Math.floor((Math.random() * 100 + 1) * (1 + powerBonus)));
  const danger = user.class === "necromancer" || isJobLarp ? 10 : Math.floor(Math.random() * 10) + 1;
  const color = randomFrom(COLORS);
  const rank = getRank(user.points);
  const xpNeeded = getXpForLevel(user.level);

  let desc = `*${intro} **${message.author.username}**...*\n\n` +
    `### ${emoji} ${message.author.username} ${action} **${target}** ${emoji}\n\n` +
    `*${outro}*`;

  if (event) desc += `\n\n> ${event.emoji} **${event.name}** ${event.desc}`;
  if (user.streak > 1) desc += `\n> 🔥 **${user.streak}x COMBO**`;
  if (leveledUp) desc += `\n> 🎉 **LEVEL UP!** You are now level **${user.level}**!`;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji}  ✦ TRANSFORMATION COMPLETE ✦  ${emoji}`)
    .setDescription(desc)
    .addFields(
      { name: `${rank.emoji} Rank`, value: `**${rank.rank}**`, inline: true },
      { name: `📊 Level`, value: `**${user.level}**\n${makeProgressBar(Math.floor((user.xp / xpNeeded) * 100))} ${user.xp}/${xpNeeded} XP`, inline: true },
      { name: `${powerData.color} Power`, value: `**${powerData.name}** ${powerNum}/100`, inline: true },
      { name: `⚠️ Danger`, value: `**${danger}/10** ${"🔴".repeat(danger)}${"⚫".repeat(10 - danger)}`, inline: true },
      { name: `✨ Points`, value: `**+${totalPoints}**\n*Total: ${user.points.toLocaleString()}*`, inline: true },
      { name: `🔥 Streak`, value: `**${user.streak}x**`, inline: true },
    );

  if (user.class) {
    const cls = LARP_CLASSES.find(c => c.id === user.class);
    if (cls) embed.setAuthor({ name: `${cls.emoji} ${cls.name}`, iconURL: message.author.displayAvatarURL({ extension: "png", size: 64 }) });
  }

  if (newAchievements.length > 0) {
    embed.addFields({ name: "🏅 New Achievements!", value: newAchievements.join("\n") });
  }

  embed
    .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 256 }))
    .setFooter({ text: `Transformed into ${target} • Level ${user.level}` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  SUBCOMMANDS
// ─────────────────────────────────────────────
async function showLarpHelp(message: Message) {
  const embed = new EmbedBuilder()
    .setColor(0x9900ff)
    .setTitle("🎭 SU LARP - The Ultimate Experience")
    .setDescription("The greatest LARP system ever created.")
    .addFields(
      { name: "🎯 Basic", value: "`su!larp <target>` - Transform!" },
      { name: "💀 Creatures", value: "🐉 dragon | 🧙 wizard | ⚔️ knight\n⚡ god | 😈 demon | 🥷 ninja\n🏴‍☠️ pirate | 🤖 robot | 🐱 cat | 🐶 dog" },
      { name: "💀 DEADLY JOBS", value: "💼 job | 📋 job application\n👔 CEO | 📎 intern | 📊 manager\n⚖️ lawyer | 💉 doctor | ⚙️ engineer\n💻 programmer | 👨‍🍳 chef | 🍽️ waiter\n🛒 retail | 💳 Karen" },
      { name: "📊 Stats", value: "`su!larp profile` - View your stats\n`su!larp achievements` - View achievements" },
      { name: "⚔️ Classes", value: "`su!larp class <name>` - Pick a class" },
      { name: "💪 Skills", value: "`su!larp skills` - View skills\n`su!larp skills <skill>` - Level up" },
      { name: "🎒 Items", value: "`su!larp inventory` - View items\n`su!larp shop` - Buy items\n`su!larp buy <item>` - Purchase" },
      { name: "⚔️ Battles", value: "`su!larp battle @user` - Battle someone!" },
      { name: "📅 Daily", value: "`su!larp daily` - Claim daily bonus" },
      { name: "🏆 Leaderboard", value: "`su!larp leaderboard` - Top LARPers" },
    )
    .setFooter({ text: "The greatest LARP system ever built ⚡" });
  await message.channel.send({ embeds: [embed] });
}

async function showProfile(message: Message, user: LarpUserData) {
  const rank = getRank(user.points);
  const xpNeeded = getXpForLevel(user.level);
  const cls = user.class ? LARP_CLASSES.find(c => c.id === user.class) : null;

  const embed = new EmbedBuilder()
    .setColor(rank.color)
    .setTitle(`${rank.emoji} ${message.author.username}'s LARP Profile`)
    .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 256 }))
    .addFields(
      { name: `${rank.emoji} Rank`, value: `**${rank.rank}**`, inline: true },
      { name: `📊 Level`, value: `**${user.level}**\n${makeProgressBar(Math.floor((user.xp / xpNeeded) * 100))} ${user.xp}/${xpNeeded} XP`, inline: true },
      { name: `✨ Total Points`, value: `**${user.points.toLocaleString()}**`, inline: true },
      { name: `🎯 Total LARPs`, value: `**${user.total}**`, inline: true },
      { name: `🔥 Best Streak`, value: `**${user.streak}x**`, inline: true },
      { name: `${cls?.emoji || "❓"} Class`, value: cls ? `**${cls.name}**` : "*None*", inline: true },
      { name: `⚔️ Battles`, value: `**${user.battleWins}W** / **${user.battleLosses}L**`, inline: true },
      { name: `📅 Daily Streak`, value: `**${user.dailyStreak}**`, inline: true },
      { name: `🏅 Achievements`, value: `**${user.achievements.length}/${LARP_ACHIEVEMENTS.length}**`, inline: true },
    )
    .setFooter({ text: `LARP Level ${user.level} • ${rank.rank}` });
  await message.channel.send({ embeds: [embed] });
}

async function showClassSelect(message: Message, user: LarpUserData, args: string[]) {
  if (!args.length || args[0] === "list") {
    const embed = new EmbedBuilder()
      .setColor(0x9900ff)
      .setTitle("⚔️ LARP Classes")
      .setDescription("Pick your destiny with `su!larp class <name>`")
      .addFields(
        ...LARP_CLASSES.map(c => ({
          name: `${c.emoji} ${c.name}`,
          value: c.desc,
          inline: true,
        }))
      );
    return message.channel.send({ embeds: [embed] });
  }

  const selected = LARP_CLASSES.find(c => c.id === args[0].toLowerCase() || c.name.toLowerCase() === args[0].toLowerCase());
  if (!selected) {
    return message.channel.send({ content: "❌ Class not found! Use `su!larp class list` to see options." });
  }

  user.class = selected.id;
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(`${selected.emoji} Class Selected!`)
    .setDescription(`You are now a **${selected.name}**!\n*${selected.desc}*`)
    .setFooter({ text: "Your class affects your LARP bonuses!" });
  await message.channel.send({ embeds: [embed] });
}

async function showSkills(message: Message, user: LarpUserData, args: string[]) {
  if (!args.length) {
    const embed = new EmbedBuilder()
      .setColor(0x00ff99)
      .setTitle("💪 LARP Skills")
      .setDescription("Level up skills with `su!larp skills <name>` (costs 500 points)")
      .addFields(
        ...LARP_SKILLS.map(s => ({
          name: `${s.emoji} ${s.name}`,
          value: `${makeProgressBar(((user.skills[s.id] || 0) / s.max) * 100, 5)} **${user.skills[s.id] || 0}/${s.max}**\n*${s.desc}*`,
          inline: true,
        }))
      )
      .setFooter({ text: `Points: ${user.points.toLocaleString()}` });
    return message.channel.send({ embeds: [embed] });
  }

  const skill = LARP_SKILLS.find(s => s.id === args[0].toLowerCase() || s.name.toLowerCase() === args[0].toLowerCase());
  if (!skill) return message.channel.send({ content: "❌ Skill not found!" });

  const current = user.skills[skill.id] || 0;
  if (current >= skill.max) return message.channel.send({ content: "❌ Skill is already maxed!" });
  if (user.points < 500) return message.channel.send({ content: "❌ Not enough points! Need 500." });

  user.points -= 500;
  user.skills[skill.id] = current + 1;

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(`${skill.emoji} Skill Upgraded!`)
    .setDescription(`**${skill.name}** is now level **${current + 1}/${skill.max}**!`)
    .setFooter({ text: `Points remaining: ${user.points.toLocaleString()}` });
  await message.channel.send({ embeds: [embed] });
}

async function showInventory(message: Message, user: LarpUserData) {
  if (!user.items.length) {
    return message.channel.send({ content: "🎒 Your inventory is empty! Visit `su!larp shop` to buy items." });
  }

  const itemList = user.items.map(id => {
    const item = LARP_ITEMS.find(i => i.id === id);
    return item ? `${item.emoji} **${item.name}** - ${item.desc}` : id;
  });

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🎒 LARP Inventory")
    .setDescription(itemList.join("\n"))
    .setFooter({ text: `${user.items.length} items` });
  await message.channel.send({ embeds: [embed] });
}

async function showAchievements(message: Message, user: LarpUserData) {
  const achs = LARP_ACHIEVEMENTS.map(a => {
    const unlocked = user.achievements.includes(a.id);
    return `${unlocked ? a.emoji : "🔒"} **${a.name}** - ${a.desc} ${unlocked ? "✅" : ""}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏅 LARP Achievements")
    .setDescription(achs.join("\n"))
    .setFooter({ text: `${user.achievements.length}/${LARP_ACHIEVEMENTS.length} unlocked` });
  await message.channel.send({ embeds: [embed] });
}

async function claimDaily(message: Message, user: LarpUserData) {
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;
  if (now - user.lastDaily < cooldown) {
    const remaining = cooldown - (now - user.lastDaily);
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return message.channel.send({ content: `❌ Daily already claimed! Wait **${hours}h ${mins}m**.` });
  }

  const isStreak = now - user.lastDaily < cooldown * 2;
  user.lastDaily = now;
  if (isStreak) user.dailyStreak++;
  else user.dailyStreak = 1;

  const baseReward = 500;
  const streakMult = Math.min(user.dailyStreak, 7);
  const totalReward = baseReward * streakMult;
  user.points += totalReward;

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("📅 Daily LARP Bonus!")
    .setDescription(
      `You claimed your daily bonus!\n\n` +
      `> 💰 **+${totalReward.toLocaleString()}** points\n` +
      `> 🔥 **${user.dailyStreak}** day streak (x${streakMult})`
    )
    .setFooter({ text: `Total: ${user.points.toLocaleString()} points` });
  await message.channel.send({ embeds: [embed] });
}

async function startBattle(message: Message, user: LarpUserData, args: string[]) {
  const target = message.mentions.users.first();
  if (!target) return message.channel.send({ content: "❌ Mention someone to battle! `su!larp battle @user`" });
  if (target.bot) return message.channel.send({ content: "❌ You can't battle bots!" });
  if (target.id === message.author.id) return message.channel.send({ content: "❌ You can't battle yourself!" });

  const targetUser = getUser(target.id);
  const userPower = user.level * 10 + (user.skills.power || 0) * 5 + Math.floor(Math.random() * 50);
  const targetPower = targetUser.level * 10 + (targetUser.skills.power || 0) * 5 + Math.floor(Math.random() * 50);

  const won = userPower >= targetPower;
  if (won) {
    user.battleWins++;
    user.points += 300;
    user.xp += 30;
    targetUser.battleLosses++;
  } else {
    user.battleLosses++;
    targetUser.battleWins++;
    targetUser.points += 300;
    targetUser.xp += 30;
  }

  const embed = new EmbedBuilder()
    .setColor(won ? 0x00ff00 : 0xff0000)
    .setTitle(`⚔️ LARP BATTLE! ⚔️`)
    .setDescription(
      `**${message.author.username}** (${userPower} ⚡) vs **${target.username}** (${targetPower} ⚡)\n\n` +
      (won
        ? `🏆 **${message.author.username}** WINS! +300 points`
        : `🏆 **${target.username}** WINS! +300 points`)
    )
    .setFooter({ text: `${user.battleWins}W/${user.battleLosses}L` });
  await message.channel.send({ embeds: [embed] });
}

async function showLeaderboard(message: Message) {
  const sorted = [...userData.entries()]
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 10);

  if (!sorted.length) return message.channel.send({ content: "No LARP data yet!" });

  const lines = sorted.map(([id, data], i) => {
    const rank = getRank(data.points);
    const medals = ["🥇", "🥈", "🥉"];
    return `${medals[i] || `**${i + 1}.**`} <@${id}> - ${rank.emoji} ${rank.rank} • **${data.points.toLocaleString()}** pts`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏆 LARP Leaderboard")
    .setDescription(lines.join("\n"))
    .setFooter({ text: "Top LARPers in the universe" });
  await message.channel.send({ embeds: [embed] });
}

async function showShop(message: Message, user: LarpUserData) {
  const items = LARP_ITEMS.map(i => {
    const owned = user.items.includes(i.id);
    return `${i.emoji} **${i.name}** - ${i.desc} ${owned ? "✅ Owned" : "💰 2000 pts"}`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🛒 LARP Shop")
    .setDescription(items.join("\n\n"))
    .setFooter({ text: `Your points: ${user.points.toLocaleString()} • Use "su!larp buy <item>"` });
  await message.channel.send({ embeds: [embed] });
}

async function buyItem(message: Message, user: LarpUserData, args: string[]) {
  if (!args.length) return message.channel.send({ content: "❌ What do you want to buy? `su!larp buy <item>`" });

  const item = LARP_ITEMS.find(i => i.id === args[0].toLowerCase() || i.name.toLowerCase() === args.join(" ").toLowerCase());
  if (!item) return message.channel.send({ content: "❌ Item not found! Check `su!larp shop`." });
  if (user.items.includes(item.id)) return message.channel.send({ content: "❌ You already own this!" });
  if (user.points < 2000) return message.channel.send({ content: "❌ Not enough points! Need 2000." });

  user.points -= 2000;
  user.items.push(item.id);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(`${item.emoji} Item Purchased!`)
    .setDescription(`You bought **${item.name}**!\n*${item.desc}*`)
    .setFooter({ text: `Points remaining: ${user.points.toLocaleString()}` });
  await message.channel.send({ embeds: [embed] });
}
