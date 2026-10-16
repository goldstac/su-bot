import { Message, EmbedBuilder } from "discord.js";
import { getUser, getTopUsers } from "./larp";

// ─────────────────────────────────────────────
//  MINIGAMES - uses the same points economy as LARP
// ─────────────────────────────────────────────

const MIN_BET = 10;
const MAX_BET = 100000;

const TRIVIA_QUESTIONS = [
  { q: "What command prefix does SU Bot use?", a: ["su!"], options: ["sudo!", "su!", "su>", "!su"] },
  { q: "How many continents are there on Earth?", a: ["7", "seven"], options: ["5", "6", "7", "8"] },
  { q: "What is the chemical symbol for gold?", a: ["au"], options: ["Go", "Au", "Gd", "Ag"] },
  { q: "Which planet is known as the Red Planet?", a: ["mars"], options: ["Venus", "Jupiter", "Mars", "Saturn"] },
  { q: "What is 9 x 9?", a: ["81"], options: ["72", "81", "90", "99"] },
  { q: "In which year did the Titanic sink?", a: ["1912"], options: ["1905", "1912", "1920", "1898"] },
  { q: "What is the largest ocean on Earth?", a: ["pacific"], options: ["Atlantic", "Indian", "Arctic", "Pacific"] },
  { q: "How many sides does a hexagon have?", a: ["6", "six"], options: ["5", "6", "7", "8"] },
  { q: "What gas do plants absorb from the atmosphere?", a: ["carbon dioxide", "co2"], options: ["Oxygen", "Nitrogen", "CO2", "Helium"] },
  { q: "What is the speed of light approximately (km/s)?", a: ["300000", "300,000", "300000000"], options: ["150,000", "300,000", "500,000", "1,000,000"] },
  { q: "Which is the longest river in the world?", a: ["nile", "the nile", "amazon", "the amazon"], options: ["Yangtze", "Nile", "Amazon", "Mississippi"] },
  { q: "What year was Discord founded?", a: ["2015"], options: ["2012", "2015", "2018", "2020"] },
  { q: "How many minutes are in a day?", a: ["1440"], options: ["1200", "1440", "1500", "2400"] },
  { q: "What is the square root of 144?", a: ["12", "twelve"], options: ["10", "11", "12", "14"] },
  { q: "Which planet has the most moons (as of 2024)?", a: ["saturn"], options: ["Jupiter", "Saturn", "Neptune", "Uranus"] },
];

const SLOTS_REELS = ["🍒", "🍋", "🔔", "💎", "7️⃣", "💩", "⭐", "🔥"];
const TRIVIA_REWARD = 200;
const TRIVIA_TIME = 20000;

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function parseBet(raw: string | undefined, points: number): number | null {
  if (raw === undefined) return null;
  if (raw.toLowerCase() === "all" || raw.toLowerCase() === "max") {
    return Math.min(points, MAX_BET);
  }
  const bet = Math.floor(Number(raw));
  if (!Number.isFinite(bet) || bet < MIN_BET) return null;
  return bet;
}

function validateBet(bet: number | null, points: number): string | null {
  if (bet === null) return `❌ Invalid bet! Minimum is **${MIN_BET}** points. Usage: \`<bet>\` (number or \`all\`)`;
  if (bet > MAX_BET) return `❌ Max bet is **${MAX_BET.toLocaleString()}** points!`;
  if (bet > points) return `❌ You don't have that many points! You have **${points.toLocaleString()}**.`;
  return null;
}

function gameEmbed(color: number, title: string, desc: string, user: { points: number }, extra?: string) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc + (extra ? `\n\n${extra}` : ""))
    .setFooter({ text: `Balance: ${user.points.toLocaleString()} points • su!games for all games` });
}

// ─────────────────────────────────────────────
//  MAIN DISPATCHER
// ─────────────────────────────────────────────
export async function handleGames(message: Message, args: string[]): Promise<void> {
  const sub = args[0]?.toLowerCase();
  const user = getUser(message.author.id);

  switch (sub) {
    case "coinflip": case "cf": return coinflip(message, user, args.slice(1));
    case "slots": case "slot": return slots(message, user, args.slice(1));
    case "dice": return dice(message, user, args.slice(1));
    case "trivia": return trivia(message, user);
    case "guess": return guess(message, user, args.slice(1));
    case "rps": return rps(message, user, args.slice(1));
    case "work": return work(message, user);
    case "leaderboard": case "lb": return gamesLeaderboard(message);
    case "balance": case "bal": return balance(message, user);
    default: return showGamesHelp(message, user);
  }
}

// ─────────────────────────────────────────────
//  HELP
// ─────────────────────────────────────────────
async function showGamesHelp(message: Message, user: ReturnType<typeof getUser>) {
  const embed = new EmbedBuilder()
    .setColor(0xff9900)
    .setTitle("🎰 SU Minigames")
    .setDescription("Gamble your LARP points! Same wallet as `su!larp`.")
    .addFields(
      { name: "🪙 Coinflip", value: "`su!coinflip <heads|tails> <bet>`\n2x payout on win", inline: true },
      { name: "🎰 Slots", value: "`su!slots <bet>`\nUp to 25x payout", inline: true },
      { name: "🎲 Dice", value: "`su!dice <over|under> <number> <bet>`\nBeat the odds, 2x payout", inline: true },
      { name: "🧠 Trivia", value: "`su!trivia`\nFirst correct answer wins 200 pts", inline: true },
      { name: "🔢 Guess", value: "`su!guess <1-10> <bet>`\n10x payout if you nail it", inline: true },
      { name: "✊✋✌️ RPS", value: "`su!rps <rock|paper|scissors> <bet>`\n1.5x payout, tie = refund", inline: true },
      { name: "💼 Work", value: "`su!work`\nEarn free points (30 min cooldown)", inline: true },
      { name: "🏆 Leaderboard", value: "`su!games leaderboard`\nTop rich players", inline: true },
      { name: "💰 Balance", value: "`su!games balance`\nCheck your points", inline: true },
    )
    .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 256 }))
    .setFooter({ text: `Your balance: ${user.points.toLocaleString()} points` });
  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  COINFLIP
// ─────────────────────────────────────────────
async function coinflip(message: Message, user: ReturnType<typeof getUser>, args: string[]) {
  const side = args[0]?.toLowerCase();
  const bet = parseBet(args[1], user.points);
  if (!["heads", "tails", "h", "t"].includes(side || "")) {
    return message.channel.send({ content: "❌ Pick a side! `su!coinflip <heads|tails> <bet>`" });
  }
  const err = validateBet(bet, user.points);
  if (err) return message.channel.send({ content: err });

  const normalized = side!.startsWith("h") ? "heads" : "tails";
  const flip = Math.random() < 0.5 ? "heads" : "tails";
  const won = flip === normalized;

  if (won) user.points += bet!;
  else user.points -= bet!;

  const embed = gameEmbed(
    won ? 0x00ff00 : 0xff0000,
    won ? "🪙 COINFLIP WIN!" : "🪙 COINFLIP LOSS",
    `The coin landed on **${flip.toUpperCase()}**!\nYou picked **${normalized.toUpperCase()}**\n\n${won ? `🏆 You won **${bet!.toLocaleString()}** points!` : `💸 You lost **${bet!.toLocaleString()}** points!`}`,
    user
  );
  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  SLOTS
// ─────────────────────────────────────────────
async function slots(message: Message, user: ReturnType<typeof getUser>, args: string[]) {
  const bet = parseBet(args[0], user.points);
  const err = validateBet(bet, user.points);
  if (err) return message.channel.send({ content: err });

  const r1 = randomFrom(SLOTS_REELS);
  const r2 = randomFrom(SLOTS_REELS);
  const r3 = randomFrom(SLOTS_REELS);

  let multiplier = 0;
  let result = "Nothing matched. The house wins!";
  if (r1 === r2 && r2 === r3) {
    if (r1 === "7️⃣") { multiplier = 25; result = "TRIPLE SEVENS! MEGA JACKPOT!"; }
    else if (r1 === "💩") { multiplier = 0.5; result = "Triple poop... we're so sorry."; }
    else { multiplier = 10; result = "TRIPLE MATCH! Huge win!"; }
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    multiplier = 2;
    result = "Pair match! Small win.";
  }

  const winnings = Math.floor(bet! * multiplier);
  const net = multiplier >= 1 ? winnings - bet! : -bet!;
  user.points += net;

  const embed = gameEmbed(
    multiplier >= 1 ? 0x00ff00 : 0xff0000,
    multiplier >= 1 ? "🎰 JACKPOT!" : "🎰 SLOTS",
    `| ${r1} | ${r2} | ${r3} |\n\n**${result}**\n\n${net >= 0 ? `🏆 Net: **+${net.toLocaleString()}**` : `💸 Net: **${net.toLocaleString()}**`}`,
    user,
    multiplier > 0 ? `Payout: **${multiplier}x** (${winnings.toLocaleString()} pts)` : undefined
  );
  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  DICE
// ─────────────────────────────────────────────
async function dice(message: Message, user: ReturnType<typeof getUser>, args: string[]) {
  const direction = args[0]?.toLowerCase();
  const target = Math.floor(Number(args[1]));
  const bet = parseBet(args[2], user.points);

  if (!["over", "under"].includes(direction || "") || !Number.isFinite(target) || target < 2 || target > 98) {
    return message.channel.send({ content: "❌ Usage: `su!dice <over|under> <number 2-98> <bet>` — roll 1-100!" });
  }
  const err = validateBet(bet, user.points);
  if (err) return message.channel.send({ content: err });

  const roll = Math.floor(Math.random() * 100) + 1;
  const won = direction === "over" ? roll > target : roll < target;
  // Payout scales with how hard the guess is
  const odds = direction === "over" ? (100 - target) / 100 : target / 100;
  const payout = Math.min(Math.floor(1 / Math.max(odds, 0.02)), 20);

  if (won) user.points += bet! * (payout - 1);
  else user.points -= bet!;

  const embed = gameEmbed(
    won ? 0x00ff00 : 0xff0000,
    won ? "🎲 DICE WIN!" : "🎲 DICE LOSS",
    `Rolled **${roll}**! You bet **${direction}** ${target}.\n\n${won ? `🏆 You win **${(bet! * (payout - 1)).toLocaleString()}** points (${payout}x payout)!` : `💸 You lost **${bet!.toLocaleString()}** points!`}`,
    user
  );
  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  TRIVIA (first to answer wins)
// ─────────────────────────────────────────────
const activeTrivia = new Set<string>();

async function trivia(message: Message, user: ReturnType<typeof getUser>) {
  if (activeTrivia.has(message.channel.id)) {
    return message.channel.send({ content: "❌ A trivia question is already active in this channel!" });
  }
  activeTrivia.add(message.channel.id);

  const question = randomFrom(TRIVIA_QUESTIONS);
  const shuffled = [...question.options].sort(() => Math.random() - 0.5);
  const letters = ["A", "B", "C", "D"];
  const correctIdx = shuffled.indexOf(question.options.find(o => question.a.includes(o.toLowerCase()))!);

  const embed = new EmbedBuilder()
    .setColor(0x00aaff)
    .setTitle("🧠 TRIVIA TIME!")
    .setDescription(
      `**${question.q}**\n\n` +
      shuffled.map((opt, i) => `${letters[i]}. ${opt}`).join("\n") +
      `\n\n⏱️ First correct answer wins **${TRIVIA_REWARD}** points! (${TRIVIA_TIME / 1000}s)`
    )
    .setFooter({ text: "Type the letter (A/B/C/D) or the answer!" });

  await message.channel.send({ embeds: [embed] });

  const filter = (m: Message) => !m.author.bot;
  const collector = message.channel.createMessageCollector({ filter, time: TRIVIA_TIME });

  collector.on("collect", (m: Message) => {
    const guess = m.content.trim().toLowerCase();
    const letterIdx = letters.indexOf(guess.toUpperCase());
    const isCorrect = (letterIdx !== -1 && letterIdx === correctIdx) ||
      question.a.includes(guess);

    if (isCorrect) {
      const winner = getUser(m.author.id);
      winner.points += TRIVIA_REWARD;
      collector.stop("answered");
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle("🧠 CORRECT!")
            .setDescription(`🏆 **${m.author.username}** nailed it! **+${TRIVIA_REWARD}** points!\nAnswer: **${letters[correctIdx]}. ${shuffled[correctIdx]}**\n*New balance: ${winner.points.toLocaleString()}*`),
        ],
      });
    }
  });

  collector.on("end", (_collected: Map<string, Message>, reason: string) => {
    activeTrivia.delete(message.channel.id);
    if (reason !== "answered") {
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x808080)
            .setTitle("🧠 Time's up!")
            .setDescription(`Nobody got it! The answer was **${letters[correctIdx]}. ${shuffled[correctIdx]}**`),
        ],
      });
    }
  });
}

// ─────────────────────────────────────────────
//  GUESS THE NUMBER
// ─────────────────────────────────────────────
async function guess(message: Message, user: ReturnType<typeof getUser>, args: string[]) {
  const pick = Math.floor(Number(args[0]));
  const bet = parseBet(args[1], user.points);

  if (!Number.isFinite(pick) || pick < 1 || pick > 10) {
    return message.channel.send({ content: "❌ Pick a number from **1 to 10**! `su!guess <1-10> <bet>`" });
  }
  const err = validateBet(bet, user.points);
  if (err) return message.channel.send({ content: err });

  const secret = Math.floor(Math.random() * 10) + 1;
  const won = pick === secret;

  if (won) user.points += bet! * 9;
  else user.points -= bet!;

  const embed = gameEmbed(
    won ? 0xffd700 : 0xff0000,
    won ? "🔢 INSANE GUESS! 10x WIN!" : "🔢 WRONG GUESS",
    `The secret number was **${secret}**. You guessed **${pick}**.\n\n${won ? `🏆 You win **${(bet! * 9).toLocaleString()}** points! (10x)` : `💸 You lost **${bet!.toLocaleString()}** points!`}`,
    user
  );
  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  ROCK PAPER SCISSORS
// ─────────────────────────────────────────────
async function rps(message: Message, user: ReturnType<typeof getUser>, args: string[]) {
  const choice = args[0]?.toLowerCase();
  const bet = parseBet(args[1], user.points);
  const map: Record<string, string> = { rock: "✊", paper: "✋", scissors: "✌️", r: "rock", p: "paper", s: "scissors" };
  const normalized = map[choice || ""] === "rock" || map[choice || ""] === "paper" || map[choice || ""] === "scissors"
    ? map[choice!] : (["rock", "paper", "scissors"].includes(choice || "") ? choice! : null);

  if (!normalized) {
    return message.channel.send({ content: "❌ Invalid choice! `su!rps <rock|paper|scissors> <bet>`" });
  }
  const err = validateBet(bet, user.points);
  if (err) return message.channel.send({ content: err });

  const bot = randomFrom(["rock", "paper", "scissors"]);
  const emojis: Record<string, string> = { rock: "✊", paper: "✋", scissors: "✌️" };
  const beats: Record<string, string> = { rock: "scissors", paper: "rock", scissors: "paper" };

  let outcome: "win" | "lose" | "tie";
  if (normalized === bot) outcome = "tie";
  else if (beats[normalized!] === bot) outcome = "win";
  else outcome = "lose";

  let net = 0;
  if (outcome === "win") { net = Math.floor(bet! * 0.5); user.points += net; }
  if (outcome === "lose") { net = -bet!; user.points += net; }

  const text = outcome === "win" ? `🏆 You win **${net.toLocaleString()}** points! (1.5x)`
    : outcome === "lose" ? `💸 You lost **${bet!.toLocaleString()}** points!`
    : "🤝 Tie! Your bet is refunded.";

  const embed = gameEmbed(
    outcome === "win" ? 0x00ff00 : outcome === "lose" ? 0xff0000 : 0xffff00,
    `✊✋✌️ ROCK PAPER SCISSORS`,
    `You: ${emojis[normalized!]} **${normalized}** vs Bot: ${emojis[bot]} **${bot}**\n\n**${outcome === "win" ? "YOU WIN!" : outcome === "lose" ? "YOU LOSE!" : "TIE!"}** ${text}`,
    user
  );
  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  WORK (free points, cooldown)
// ─────────────────────────────────────────────
const WORK_LINES = [
  { job: "🧹 Professional dishwasher", pay: 150 },
  { job: "🍔 Fast food warrior", pay: 200 },
  { job: "💻 Disc bot developer", pay: 500 },
  { job: "🧹 Server janitor", pay: 120 },
  { job: "💼 Middle manager", pay: 350 },
  { job: "🧹 LARP arena cleaner", pay: 180 },
  { job: "🎰 Casino dealer", pay: 300 },
  { job: "📧 Reply-all email specialist", pay: 90 },
  { job: "⚡ Lightning technician", pay: 400 },
  { job: "🗑️ Professional trash collector", pay: 160 },
];

async function work(message: Message, user: ReturnType<typeof getUser>) {
  const cooldown = 30 * 60 * 1000;
  const now = Date.now();
  const next = (user as any).lastWork || 0;
  if (now - next < cooldown) {
    const remaining = Math.ceil((cooldown - (now - next)) / 60000);
    return message.channel.send({ content: `❌ You're exhausted! Work again in **${remaining} minutes**.` });
  }
  (user as any).lastWork = now;

  const job = randomFrom(WORK_LINES);
  const bonus = Math.floor(Math.random() * 100);
  const total = job.pay + bonus;
  user.points += total;

  const embed = gameEmbed(
    0x00ff99,
    `💼 SHIFT COMPLETE`,
    `You worked as a **${job.job}** and earned:\n\n💰 **+${total.toLocaleString()}** points (*${job.pay} base + ${bonus} bonus*)\n\n*Come back in 30 minutes for another shift.*`,
    user
  );
  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  LEADERBOARD & BALANCE
// ─────────────────────────────────────────────
async function gamesLeaderboard(message: Message) {
  const top = getTopUsers(10);
  if (!top.length) return message.channel.send({ content: "No one has any points yet!" });

  const medals = ["🥇", "🥈", "🥉"];
  const lines = top.map(([id, data], i) =>
    `${medals[i] || `**${i + 1}.**`} <@${id}> - **${data.points.toLocaleString()}** pts`
  );

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("💰 Richest Players")
    .setDescription(lines.join("\n"))
    .setFooter({ text: "Richer than everyone else" });
  await message.channel.send({ embeds: [embed] });
}

async function balance(message: Message, user: ReturnType<typeof getUser>) {
  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("💰 Your Wallet")
    .setDescription(`You have **${user.points.toLocaleString()}** points.`)
    .setThumbnail(message.author.displayAvatarURL({ extension: "png", size: 256 }))
    .setFooter({ text: "Earn more with su!games, su!larp, or su!work" });
  await message.channel.send({ embeds: [embed] });
}
