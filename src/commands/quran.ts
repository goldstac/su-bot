import { Message, EmbedBuilder } from "discord.js";
import type { QSong } from "../quran";
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
  summarize,
  unlinkUser,
} from "../quran";

const GREEN = 0x1db954;
const GOLD = 0xc9a86c;
const AMBER = 0xff9900;
const GREY = 0x808080;
const APP_ICON = "https://raw.githubusercontent.com/goldstac/quran/main/app_logo.png";

const APP = "Quran app";

function colorFor(kind: string): number {
  return kind === "quran" ? GOLD : GREEN;
}

function card(color: number, context: string, title: string): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setAuthor({ name: context, iconURL: APP_ICON }).setTitle(title);
}

function clamp(text: string, max = 58): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function count(n: number, unit: string): string {
  return `${n.toLocaleString()} ${unit}${n === 1 ? "" : "s"}`;
}

function statLine(plays: number, seconds: number): string {
  return seconds > 0 ? `${count(plays, "play")} · ${formatDuration(seconds)}` : count(plays, "play");
}

function sourceName(song: QSong): string {
  if (song.kind === "quran") return "Quran";
  if (song.local) return "Your file";
  return "Nasheed";
}

function notLinkedEmbed(name: string, isSelf: boolean): EmbedBuilder {
  return card(GREY, APP, "Not linked").setDescription(
    isSelf
      ? "Run `su!track link` for a code, then paste it in the app under **Settings → Discord bot**."
      : `**${name}** has not linked the Quran app.`
  );
}

function nothingPlayingEmbed(name: string, isSelf: boolean): EmbedBuilder {
  const embed = card(GREY, APP, isSelf ? "Nothing playing" : `${name} has nothing playing`).setDescription(
    isSelf ? "Play something in the Quran app, then run `su!track` again." : "Nothing is playing in their app right now."
  );
  if (isSelf) embed.setFooter({ text: "su!fm for what you have played" });
  return embed;
}

function youTubeUrl(song: QSong): string | undefined {
  if (song.kind !== "quran" && !song.local && /^[A-Za-z0-9_-]{11}$/.test(song.id)) {
    return `https://www.youtube.com/watch?v=${song.id}`;
  }
  return undefined;
}

// ─────────────────────────────────────────────
//  su!track - now playing, linking, privacy
// ─────────────────────────────────────────────
export async function handleTrack(message: Message, args: string[]): Promise<void> {
  const sub = (args[0] || "").toLowerCase();

  if (["link", "connect"].includes(sub)) {
    const code = createLinkCode(message.author.id, message.author.username);
    const embed = card(GREEN, APP, "Link your app")
      .setDescription(
        `\`\`\`\n${code}\n\`\`\`\n` +
          `**1.** Copy the code above\n` +
          `**2.** Open the app and go to **Settings → Discord bot**\n` +
          `**3.** Paste it in **Link code** and hit **Link**`
      )
      .setFooter({ text: "Code expires in 10 minutes" })
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (["unlink", "disconnect"].includes(sub)) {
    const existed = unlinkUser(message.author.id);
    const embed = card(existed ? AMBER : GREY, APP, existed ? "App unlinked" : "Nothing to unlink").setDescription(
      existed
        ? "Your saved stats stay on the bot, so `su!track link` brings everything back."
        : "You do not have the app linked. `su!track link` connects it."
    );
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (sub === "off" || sub === "pause") {
    if (!getLinkedUser(message.author.id)) {
      await message.channel.send({ embeds: [notLinkedEmbed(message.author.username, true)] });
      return;
    }
    setTracking(message.author.id, false);
    const embed = card(AMBER, APP, "Tracking off").setDescription(
      "Nothing you play gets recorded, and `su!track` shows nothing playing. `su!track on` turns it back on."
    );
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (sub === "on" || sub === "resume") {
    if (!getLinkedUser(message.author.id)) {
      await message.channel.send({ embeds: [notLinkedEmbed(message.author.username, true)] });
      return;
    }
    setTracking(message.author.id, true);
    const embed = card(GREEN, APP, "Tracking on").setDescription(
      "Plays are counted again. A nasheed hidden with the eye button in the app stays hidden."
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
    await message.channel.send({
      embeds: [
        card(AMBER, APP, "Tracking is off").setDescription(
          isSelf
            ? "You turned tracking off, so nothing is recorded. `su!track on` re-enables it."
            : `**${name}** has tracking turned off.`
        ),
      ],
    });
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
  const stat = user.stats.songs[song.id];
  const stats = summarize(user, "all");

  const lines = [song.channel];
  if (bar) lines.push("", `\`${bar}\``, `\`${clockDuration(position)} / ${clockDuration(song.duration)}\``);

  const state = now.playing ? "now playing" : "paused";
  const context = isSelf ? `You · ${state}` : `${name} · ${state}`;
  const embed = card(colorFor(song.kind), context, song.title)
    .setDescription(lines.join("\n"))
    .addFields(
      { name: "Type", value: sourceName(song), inline: true },
      { name: "This track", value: statLine(stat?.count ?? 0, stat?.seconds ?? 0), inline: true },
      { name: "All time", value: statLine(stats.totalPlays, user.stats.seconds), inline: true }
    )
    .setFooter({ text: isSelf ? "su!fm" : "su!fm @user" })
    .setTimestamp();

  const url = youTubeUrl(song);
  if (url) embed.setURL(url);

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
    const lines = plays.map(
      (p, i) =>
        `\`${String(i + 1).padStart(2, " ")}\` ${p.kind === "quran" ? "📖" : "📻"} **${clamp(p.title)}** · ${p.channel} · ${relative(p.at)}`
    );
    await message.channel.send({
      embeds: [
        card(GREEN, isSelf ? "Your listening" : `${name}'s listening`, "Recent plays")
          .setDescription(lines.length ? lines.join("\n") : "Nothing recorded yet. Play something in the Quran app.")
          .setFooter({ text: "su!fm week · su!fm month" })
          .setTimestamp(),
      ],
    });
    return;
  }

  const s = summarize(user, period);
  const embed = card(GREEN, isSelf ? "Your listening" : `${name}'s listening`, meta.label);

  if (!s.plays) {
    embed.setDescription(period === "all" ? "Nothing recorded yet." : `Nothing in the ${meta.window}.`);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  const topSongs = s.topSongs
    .map((song, i) => `\`${i + 1}\` **${clamp(song.title)}** · ${song.count}x${song.seconds ? ` · ${formatDuration(song.seconds)}` : ""}`)
    .join("\n");

  const topChannels = s.topChannels
    .map((c, i) => `\`${i + 1}\` **${clamp(c.channel, 40)}** · ${c.count}x`)
    .join("\n");

  embed
    .setDescription(
      `**${count(s.plays, "play")}**\n📖 ${count(s.quranPlays, "quran play")} • 📻 ${count(s.nasheedPlays, "nasheed play")}`
    )
    .addFields(
      { name: "Listened", value: formatDuration(s.seconds), inline: true },
      { name: "Unique", value: s.unique.toLocaleString(), inline: true },
      { name: "Days active", value: s.activeDays.toLocaleString(), inline: true },
      { name: "Top nasheeds", value: topSongs || "*Nothing in this period*" },
      { name: "Top channels", value: topChannels || "*Nothing in this period*" }
    )
    .setFooter({ text: isSelf ? "su!fm recent" : "su!fm recent @user" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}
