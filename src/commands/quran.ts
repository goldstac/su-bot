import { Message, EmbedBuilder } from "discord.js";
import {
  createLinkCode,
  elapsed,
  formatDuration,
  getLinkedUser,
  getNow,
  clockDuration,
  progressBar,
  recentPlays,
  relative,
  setTracking,
  songLabel,
  summarize,
  unlinkUser,
} from "../quran";

const GREEN = 0x1db954;
const GOLD = 0xc9a86c;

function colorFor(kind: string): number {
  return kind === "quran" ? GOLD : GREEN;
}

function notLinkedEmbed(name: string, isSelf: boolean): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(GREEN)
    .setTitle("🎧 Quran app not linked")
    .setDescription(
      isSelf
        ? `Run \`su!track link\` to connect the app, then paste the code in **Settings → Discord bot**.\n\nOnce linked, this shows what you are listening to and \`su!fm\` counts your plays.`
        : `**${name}** has not linked the Quran app yet.`
    )
    .setFooter({ text: "Quran app • Settings → Discord bot" });
  return embed;
}

function nothingPlayingEmbed(name: string, isSelf: boolean): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(isSelf ? "🎧 Nothing playing" : `🎧 ${name} is not listening`)
    .setDescription(
      isSelf
        ? "Open the Quran app and play a nasheed or a surah, then run `su!track` again.\n\n`su!fm` shows what you have listened to so far."
        : "Nothing is playing in their Quran app right now."
    )
    .setFooter({ text: "su!track link to connect your own app" });
}

// ─────────────────────────────────────────────
//  su!track - now playing, linking, privacy
// ─────────────────────────────────────────────
export async function handleTrack(message: Message, args: string[]): Promise<void> {
  const sub = (args[0] || "").toLowerCase();

  if (["link", "connect"].includes(sub)) {
    const code = createLinkCode(message.author.id, message.author.username);
    const embed = new EmbedBuilder()
      .setColor(GREEN)
      .setTitle("🎧 Link your Quran app")
      .setDescription(
        `**1.** Copy this code\n\`\`\`\n${code}\n\`\`\`\n` +
          `**2.** Open the Quran app and go to **Settings → Discord bot**\n` +
          `**3.** Paste it in **Link code** and hit **Link**`
      )
      .addFields({
        name: "What you get",
        value:
          "`su!track` — what you are listening to right now\n" +
          "`su!fm` — how many times you have listened to what\n" +
          "`su!track off` — stop reporting any of it",
      })
      .setFooter({ text: `Code expires in 10 minutes • ${message.author.username}` })
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (["unlink", "disconnect"].includes(sub)) {
    const existed = unlinkUser(message.author.id);
    const embed = new EmbedBuilder()
      .setColor(existed ? 0xff9900 : 0x808080)
      .setTitle(existed ? "🔌 Quran app unlinked" : "Nothing to unlink")
      .setDescription(
        existed
          ? "The app can no longer report what you listen to. Your saved stats stay on the bot, so `su!track link` brings everything back."
          : "You do not have the Quran app linked. Use `su!track link` to connect it."
      );
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (sub === "off" || sub === "pause") {
    const user = setTracking(message.author.id, false);
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle("🕶️ Tracking off")
      .setDescription(
        user
          ? "Nothing you play gets recorded any more, and `su!track` shows nothing playing. `su!track on` turns it back on."
          : "Link the app first with `su!track link`."
      );
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (sub === "on" || sub === "resume") {
    const user = setTracking(message.author.id, true);
    const embed = new EmbedBuilder()
      .setColor(GREEN)
      .setTitle("🎧 Tracking on")
      .setDescription(
        user
          ? "Plays are counted again. Hiding a single nasheed in the app still keeps that one out of here."
          : "Link the app first with `su!track link`."
      );
    await message.channel.send({ embeds: [embed] });
    return;
  }

  const target = message.mentions.users.first();
  const isSelf = !target || target.id === message.author.id;
  const userId = target?.id ?? message.author.id;
  const name = target?.username ?? message.author.username;

  const user = getLinkedUser(userId);
  if (!user) {
    await message.channel.send({ embeds: [notLinkedEmbed(name, isSelf)] });
    return;
  }

  if (!user.tracking) {
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle("🕶️ Tracking is off")
      .setDescription(
        isSelf
          ? "You turned tracking off, so nothing is recorded. `su!track on` re-enables it."
          : `**${name}** has tracking turned off.`
      );
    await message.channel.send({ embeds: [embed] });
    return;
  }

  const now = getNow(userId);
  if (!now) {
    await message.channel.send({ embeds: [nothingPlayingEmbed(name, isSelf)] });
    return;
  }

  const song = now.song;
  const position = elapsed(now);
  const bar = progressBar(position, song.duration);
  const state = now.playing ? "▶️ Playing" : "⏸️ Paused";
  const lines: string[] = [
    `**${song.title}**`,
    songLabel(song),
  ];
  if (bar) lines.push("", `\`${bar}\``, `\`${clockDuration(position)} / ${clockDuration(song.duration)}\` ${state}`);
  else lines.push("", state);

  const stats = summarize(user, "all");
  const embed = new EmbedBuilder()
    .setColor(colorFor(song.kind))
    .setAuthor({ name: isSelf ? "You are listening to" : `${name} is listening to` })
    .setDescription(lines.join("\n"))
    .addFields(
      { name: "Source", value: song.kind === "quran" ? "📖 Quran" : song.local ? "🎧 Your own file" : "📻 Nasheed", inline: true },
      { name: "Total plays", value: `**${stats.totalPlays.toLocaleString()}**`, inline: true },
      { name: "Listened", value: `**${formatDuration(user.stats.seconds)}**`, inline: true }
    )
    .setFooter({ text: `su!fm for the full breakdown • ${isSelf ? "su!track off to stop reporting" : name}` })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

// ─────────────────────────────────────────────
//  su!fm - listening stats
// ─────────────────────────────────────────────
const PERIODS: Record<string, { label: string; window: string }> = {
  week: { label: "This week", window: "last 7 days" },
  month: { label: "This month", window: "last 30 days" },
  all: { label: "All time", window: "since linking" },
};

export async function handleFm(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first();
  const isSelf = !target || target.id === message.author.id;
  const name = target?.username ?? message.author.username;
  const words = args.filter((a) => !a.startsWith("<@")).map((a) => a.toLowerCase());

  const user = getLinkedUser(target?.id ?? message.author.id);
  if (!user) {
    await message.channel.send({ embeds: [notLinkedEmbed(name, isSelf)] });
    return;
  }

  let period = words.find((w) => w in PERIODS) ?? "all";
  if (words.includes("today")) period = "week";
  const meta = PERIODS[period]!;

  if (words.includes("recent") || words.includes("history")) {
    const plays = recentPlays(user, 10);
    const embed = new EmbedBuilder()
      .setColor(GREEN)
      .setTitle(`🕘 Recent plays — ${isSelf ? "you" : name}`)
      .setDescription(
        plays.length
          ? plays.map((p, i) => `\`${i + 1}.\` **${p.title}** • ${p.kind === "quran" ? "📖" : "📻"} ${p.channel} — *${relative(p.at)}*`).join("\n")
          : "Nothing recorded yet. Play something in the Quran app."
      )
      .setFooter({ text: "su!fm week/month for counts • su!fm @user to peek at someone else" })
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  const s = summarize(user, period);
  const topSongs = s.topSongs.length
    ? s.topSongs
        .map(
          (song, i) =>
            `\`${i + 1}.\` **${song.title}** — ${song.count}x${song.seconds ? ` (${formatDuration(song.seconds)})` : ""}`
        )
        .join("\n")
    : "*Nothing in this period*";

  const topChannels = s.topChannels.length
    ? s.topChannels.map((c, i) => `\`${i + 1}.\` **${c.channel}** — ${c.count}x`).join("\n")
    : "*Nothing in this period*";

  const split = s.plays
    ? `📖 Quran \`${s.quranPlays}\` • 📻 Nasheeds \`${s.nasheedPlays}\``
    : "*Nothing in this period*";

  const embed = new EmbedBuilder()
    .setColor(GREEN)
    .setAuthor({ name: `${isSelf ? "Your" : `${name}'s`} listening — ${meta.label}` })
    .setDescription(
      s.plays
        ? `**${s.plays.toLocaleString()}** plays • **${s.unique}** nasheeds • **${formatDuration(s.seconds)}** listened`
        : "Nothing recorded in this period yet."
    )
    .addFields(
      { name: "🏆 Top nasheeds", value: topSongs },
      { name: "🎙️ Top channels & reciters", value: topChannels },
      { name: "🧭 Split", value: split, inline: true },
      { name: "📅 Active days", value: `\`${s.activeDays}\``, inline: true },
      { name: "📈 All time", value: `\`${s.totalPlays.toLocaleString()}\` plays • \`${formatDuration(user.stats.seconds)}\``, inline: true }
    )
    .setFooter({
      text: isSelf
        ? `Window: ${meta.window} • su!fm recent for history`
        : `Window: ${meta.window} • su!fm recent @user for history`,
    })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
