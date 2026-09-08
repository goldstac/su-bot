import {
  Message,
  EmbedBuilder,
  AttachmentBuilder,
  User,
} from "discord.js";
import {
  renderFrame,
  getFrameCount,
  getFrameLabel,
} from "../utils/smiteImage";

const SMITE_REASONS = [
  "for being too toxic in Joust",
  "for feeding in Conquest",
  "for stealing buffs",
  "for not calling MIA",
  "for buying the wrong items",
  "for missing every ability",
  "for inting in Ranked",
  "for existing",
  "for picking Loki",
  "for spam VGS",
  "for dancing in base",
  "for not warding",
  "for rage quitting",
  "for being a minion",
  "for dying to fire giant",
];

const LARP_SMITE_REASONS = [
  "for their terrible larp application",
  "for larping as something unworthy",
  "for failing the larp interview",
  "for low larp power level",
  "for not meeting larp qualifications",
  "for violating larp policy",
  "for excessive larping without a permit",
  "for refusing to larp properly",
  "for being a larp fraud",
  "for crimes against larpkind",
  "for larping while unqualified",
  "for failing the larp background check",
  "for larp insubordination",
  "for illegal larp activities",
  "for larp tax evasion",
];

function randomReason(isLarp: boolean): string {
  const reasons = isLarp ? LARP_SMITE_REASONS : SMITE_REASONS;
  return reasons[Math.floor(Math.random() * reasons.length)];
}

async function fetchAvatarBuffer(user: User): Promise<Buffer | null> {
  try {
    const url = user.displayAvatarURL({ extension: "png", size: 256 });
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function parseArgs(args: string[]): { targetArg: string | null; customReason: string | null } {
  let targetArg: string | null = null;
  let customReason: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i].toLowerCase() === "?r" && i + 1 < args.length) {
      customReason = args.slice(i + 1).join(" ");
      break;
    }
    if (!targetArg) {
      targetArg = args[i];
    }
  }

  return { targetArg, customReason };
}

export async function handleSmite(
  message: Message,
  args: string[],
  isLarp: boolean = false
): Promise<void> {
  const { targetArg, customReason } = parseArgs(args);

  const target =
    message.mentions.users.first() ||
    (targetArg
      ? await message.client.users.fetch(targetArg).catch(() => null)
      : null);

  if (!target) {
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setDescription(`⚡ You must mention someone to smite! \`${isLarp ? "su!smite.larp" : "su!smite"} @user\``)
      .setFooter({ text: "No user, no root." });
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (target.id === message.author.id) {
    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setDescription("⚡ You cannot smite yourself! Permission denied.")
      .setFooter({ text: "Try another user." });
    await message.channel.send({ embeds: [embed] });
    return;
  }

  if (target.bot) {
    const embed = new EmbedBuilder()
      .setColor(0xff3333)
      .setDescription("⚡ You cannot smite a bot! Root access denied.")
      .setFooter({ text: "Nice try though." });
    await message.channel.send({ embeds: [embed] });
    return;
  }

  const reason = customReason ? `for ${customReason}` : randomReason(isLarp);
  const avatarBuffer = await fetchAvatarBuffer(target);
  const frameCount = getFrameCount();

  // Initial message
  const startEmbed = new EmbedBuilder()
    .setColor(isLarp ? 0xff0066 : 0x9900ff)
    .setDescription(isLarp
      ? `💀 ${message.author} is initiating LARP TERMINATION PROTOCOL...`
      : `⚡ ${message.author} is escalating to root...`)
    .setFooter({ text: isLarp ? "LARP clearance granted." : "Permission granted." });

  const botMessage = await message.channel.send({ embeds: [startEmbed] });

  // Animation frames
  for (let i = 0; i < frameCount; i++) {
    await new Promise((r) => setTimeout(r, 600));

    const imageBuffer = renderFrame(i, avatarBuffer);
    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "smite.png",
    });

    const animEmbed = new EmbedBuilder()
      .setColor(i === frameCount - 1 ? (isLarp ? 0xff0066 : 0xffd700) : (isLarp ? 0xff0066 : 0x9900ff))
      .setDescription(isLarp
        ? `💀 ${message.author} initiates **LARP TERMINATION** upon ${target}!`
        : `⚡ ${message.author} channels the **SMITE** upon ${target}!`)
      .setImage("attachment://smite.png")
      .setFooter({ text: getFrameLabel(i) });

    await botMessage.edit({ embeds: [animEmbed], files: [attachment] });
  }

  // Final smite message
  await new Promise((r) => setTimeout(r, 800));

  const finalEmbed = new EmbedBuilder()
    .setColor(isLarp ? 0xff0066 : 0xff0000)
    .setTitle(isLarp ? "💀 LARP TERMINATED 💀" : "⚡ SMITE ⚡")
    .setDescription(
      isLarp
        ? `${target} has been **TERMINATED FROM LARP DUTY** ${reason}!`
        : `${target} has been **SMITEN** ${reason}!`
    )
    .addFields(
      { name: "Summoned by", value: `${message.author}`, inline: true },
      { name: "Judgment", value: isLarp ? "LARP access revoked." : "Process terminated.", inline: true }
    )
    .setThumbnail(target.displayAvatarURL({ extension: "png", size: 128 }))
    .setFooter({ text: isLarp ? "LARP terminated. 💀" : "Access revoked. ⚡" })
    .setTimestamp();

  await botMessage.edit({ embeds: [finalEmbed], files: [] });
}
