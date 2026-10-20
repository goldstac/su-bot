// ─────────────────────────────────────────────
//  QURAN APP TRACKING - link codes, now playing, listening stats
// ─────────────────────────────────────────────

import { existsSync, mkdirSync } from "fs";

const DATA_DIR = "data";
const DATA_FILE = `${DATA_DIR}/quran.json`;
const CODE_TTL = 10 * 60 * 1000;
const HISTORY_CAP = 100;
const IDLE_CUTOFF = 2 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export interface QSong {
  id: string;
  title: string;
  channel: string;
  kind: string;
  duration: number;
  local?: boolean;
}

export interface QNow {
  song: QSong;
  startedAt: number;
  position: number;
  playing: boolean;
  updatedAt: number;
}

export interface QSongStat {
  title: string;
  channel: string;
  kind: string;
  count: number;
  seconds: number;
  last: number;
  days: Record<string, number>;
  secDays: Record<string, number>;
}

export interface QPlay {
  id: string;
  title: string;
  channel: string;
  kind: string;
  at: number;
}

export interface QStats {
  total: number;
  seconds: number;
  songs: Record<string, QSongStat>;
  days: Record<string, number>;
  recent: QPlay[];
  secDays: Record<string, number>;
}

export interface QUser {
  token: string;
  name: string;
  tracking: boolean;
  linkedAt: number;
  stats: QStats;
  now?: QNow;
}

interface QCode {
  discordId: string;
  name: string;
  expires: number;
}

interface QStore {
  users: Record<string, QUser>;
  codes: Record<string, QCode>;
}

function emptyStats(): QStats {
  return { total: 0, seconds: 0, songs: {}, days: {}, recent: [], secDays: {} };
}

function isStore(value: unknown): value is QStore {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<QStore>;
  return typeof v.users === "object" && typeof v.codes === "object";
}

let store: QStore = { users: {}, codes: {} };

if (await Bun.file(DATA_FILE).exists()) {
  try {
    const parsed: unknown = await Bun.file(DATA_FILE).json();
    if (isStore(parsed)) store = parsed;
  } catch {
    console.warn("⚠️  Could not read data/quran.json, starting fresh");
  }
}

let saveChain: Promise<void> = Promise.resolve();

function save(): void {
  saveChain = saveChain.then(async () => {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      await Bun.write(DATA_FILE, JSON.stringify(store, null, 2));
    } catch (err: any) {
      console.error("❌ Could not save Quran tracking data:", err?.message);
    }
  });
}

// ── helpers ──────────────────────────────────

export function dayKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function clockDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function relative(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function progressBar(position: number, duration: number, size = 16): string {
  if (!duration || duration <= 0) return "";
  const ratio = Math.min(1, Math.max(0, position / duration));
  const filled = Math.round(ratio * size);
  return "▬".repeat(filled) + "🔘" + "─".repeat(Math.max(0, size - filled + 1));
}

function normalizeSong(raw: unknown): QSong | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? "").slice(0, 64);
  const title = String(r.title ?? "").slice(0, 200);
  if (!id || !title) return null;
  const duration = Math.round(Number(r.duration));
  return {
    id,
    title,
    channel: String(r.channel ?? "Unknown").slice(0, 120) || "Unknown",
    kind: r.kind === "quran" ? "quran" : "nasheed",
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
    local: !!r.local,
  };
}

function sourceLabel(song: QSong): string {
  if (song.kind === "quran") return "📖 Quran";
  if (song.local) return "🎧 Your own file";
  return "📻 Nasheed";
}

export function songLabel(song: QSong): string {
  return `${sourceLabel(song)} • ${song.channel}`;
}

// ── linking ──────────────────────────────────

function pruneCodes(): void {
  const now = Date.now();
  for (const [code, data] of Object.entries(store.codes)) {
    if (data.expires < now) delete store.codes[code];
  }
}

export function createLinkCode(discordId: string, name: string): string {
  pruneCodes();
  let code = "";
  do {
    code = Array.from(
      { length: 6 },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]!
    ).join("");
  } while (store.codes[code]);
  store.codes[code] = { discordId, name, expires: Date.now() + CODE_TTL };
  save();
  return code;
}

export function redeemLinkCode(
  rawCode: unknown
): { ok: true; token: string; user: { id: string; name: string } } | { ok: false; error: string } {
  const code = String(rawCode ?? "").trim().toUpperCase();
  if (!code) return { ok: false, error: "A link code is required" };
  pruneCodes();
  const entry = store.codes[code];
  if (!entry) return { ok: false, error: "Invalid or expired link code" };
  delete store.codes[code];

  const token = crypto.randomUUID();
  const existing = store.users[entry.discordId];
  if (existing) {
    existing.token = token;
    existing.name = entry.name;
  } else {
    store.users[entry.discordId] = {
      token,
      name: entry.name,
      tracking: true,
      linkedAt: Date.now(),
      stats: emptyStats(),
    };
  }
  save();
  return { ok: true, token, user: { id: entry.discordId, name: entry.name } };
}

export function unlinkUser(discordId: string): boolean {
  const user = store.users[discordId];
  const existed = !!user?.token;
  if (user) {
    user.token = "";
    user.now = undefined;
  }
  for (const [code, data] of Object.entries(store.codes)) {
    if (data.discordId === discordId) delete store.codes[code];
  }
  if (existed) save();
  return existed;
}

export function getLinkedUser(discordId: string): QUser | undefined {
  const user = store.users[discordId];
  return user?.token ? user : undefined;
}

export function linkedCount(): number {
  return Object.values(store.users).filter((u) => u.token).length;
}

export function setTracking(discordId: string, on: boolean): QUser | undefined {
  const user = store.users[discordId];
  if (!user) return undefined;
  user.tracking = on;
  if (!on) user.now = undefined;
  save();
  return user;
}

// ── now playing ──────────────────────────────

export function getNow(discordId: string): QNow | undefined {
  const now = store.users[discordId]?.now;
  if (!now) return undefined;
  if (isStale(now)) {
    delete store.users[discordId]!.now;
    save();
    return undefined;
  }
  return now;
}

function isStale(now: QNow): boolean {
  if (!now.playing) return false;
  if (Date.now() - now.updatedAt > IDLE_CUTOFF) return true;
  if (now.song.duration > 0) {
    const elapsed = now.position + (Date.now() - now.updatedAt) / 1000;
    if (elapsed > now.song.duration + 15) return true;
  }
  return false;
}

export function elapsed(now: QNow): number {
  if (!now.playing) return now.position;
  const extra = Math.max(0, (Date.now() - now.updatedAt) / 1000);
  const total = now.position + extra;
  return now.song.duration > 0 ? Math.min(total, now.song.duration) : total;
}

// ── events from the app ──────────────────────

function userByToken(token: string): [string, QUser] | undefined {
  if (!token) return undefined;
  return Object.entries(store.users).find(([, u]) => u.token && u.token === token);
}

function accumulate(user: QUser, at: number): void {
  const now = user.now;
  if (!now || !now.playing) return;
  const extra = (at - now.updatedAt) / 1000;
  if (extra <= 0 || extra > 3600) return;
  const day = dayKey(at);
  user.stats.seconds += extra;
  user.stats.secDays = user.stats.secDays ?? {};
  user.stats.secDays[day] = (user.stats.secDays[day] ?? 0) + extra;
  const stat = user.stats.songs[now.song.id];
  if (stat) {
    stat.seconds += extra;
    stat.secDays = stat.secDays ?? {};
    stat.secDays[day] = (stat.secDays[day] ?? 0) + extra;
  }
  now.position += extra;
}

export function recordEvent(
  token: string,
  body: unknown
): { ok: true; player?: string } | { ok: false; error: string } {
  const found = userByToken(token);
  if (!found) return { ok: false, error: "Unknown or revoked token" };
  const user = found[1];
  if (!user.tracking) return { ok: true, player: user.name };

  const data = (body ?? {}) as Record<string, unknown>;
  const event = String(data.event ?? "");
  const now = Date.now();
  const position = Math.max(0, Math.round(Number(data.position) || 0));

  accumulate(user, now);

  switch (event) {
    case "start": {
      const song = normalizeSong(data.song);
      if (!song) return { ok: false, error: "A song is required for a start event" };
      user.now = { song, startedAt: now - position * 1000, position, playing: true, updatedAt: now };
      const stat = user.stats.songs[song.id] ?? {
        title: song.title,
        channel: song.channel,
        kind: song.kind,
        count: 0,
        seconds: 0,
        last: 0,
        days: {},
        secDays: {},
      };
      stat.title = song.title;
      stat.channel = song.channel;
      stat.kind = song.kind;
      stat.count += 1;
      stat.last = now;
      const day = dayKey(now);
      stat.days[day] = (stat.days[day] ?? 0) + 1;
      user.stats.songs[song.id] = stat;
      user.stats.total += 1;
      user.stats.days[day] = (user.stats.days[day] ?? 0) + 1;
      user.stats.recent.unshift({
        id: song.id,
        title: song.title,
        channel: song.channel,
        kind: song.kind,
        at: now,
      });
      user.stats.recent = user.stats.recent.slice(0, HISTORY_CAP);
      break;
    }
    case "progress":
    case "resume":
    case "pause": {
      if (!user.now) break;
      const sid = typeof data.songId === "string" ? data.songId : "";
      if (sid && user.now.song.id !== sid) break;
      user.now.position = position;
      user.now.startedAt = now - position * 1000;
      user.now.playing = event !== "pause";
      user.now.updatedAt = now;
      break;
    }
    case "hidden":
    case "stop": {
      user.now = undefined;
      break;
    }
    default:
      return { ok: false, error: `Unknown event "${event}"` };
  }

  save();
  return { ok: true, player: user.name };
}

// ── stats ────────────────────────────────────

export interface TopSong {
  id: string;
  title: string;
  channel: string;
  kind: string;
  count: number;
  seconds: number;
}

export interface StatsSummary {
  period: string;
  plays: number;
  totalPlays: number;
  seconds: number;
  unique: number;
  activeDays: number;
  quranPlays: number;
  nasheedPlays: number;
  topSongs: TopSong[];
  topChannels: { channel: string; count: number }[];
  linkedAt: number;
  tracking: boolean;
}

export function periodStart(period: string): number {
  const day = 86400000;
  if (period === "week") return Date.now() - 7 * day;
  if (period === "month") return Date.now() - 30 * day;
  return 0;
}

export function summarize(user: QUser, period = "all"): StatsSummary {
  const from = periodStart(period);
  const fromDay = from ? dayKey(from) : "";
  const inPeriod = (day: string) => !fromDay || day >= fromDay;

  let plays = 0;
  let unique = 0;
  let activeDays = 0;
  let seconds = 0;
  let quranPlays = 0;
  let nasheedPlays = 0;
  const songs: TopSong[] = [];
  const channels = new Map<string, number>();

  for (const [day, count] of Object.entries(user.stats.days)) {
    if (inPeriod(day)) {
      plays += count;
      activeDays += 1;
    }
  }

  for (const [day, secs] of Object.entries(user.stats.secDays ?? {})) {
    if (inPeriod(day)) seconds += secs;
  }

  for (const [id, stat] of Object.entries(user.stats.songs)) {
    let count = 0;
    let songSeconds = 0;
    for (const [day, n] of Object.entries(stat.days)) {
      if (inPeriod(day)) count += n;
    }
    for (const [day, secs] of Object.entries(stat.secDays ?? {})) {
      if (inPeriod(day)) songSeconds += secs;
    }
    if (!count) continue;
    unique += 1;
    if (stat.kind === "quran") quranPlays += count;
    else nasheedPlays += count;
    songs.push({ id, title: stat.title, channel: stat.channel, kind: stat.kind, count, seconds: songSeconds });
  }

  for (const song of songs) {
    channels.set(song.channel, (channels.get(song.channel) ?? 0) + song.count);
  }

  songs.sort((a, b) => b.count - a.count || b.seconds - a.seconds);

  return {
    period,
    plays,
    totalPlays: user.stats.total,
    seconds,
    unique,
    activeDays,
    quranPlays,
    nasheedPlays,
    topSongs: songs.slice(0, 5),
    topChannels: [...channels.entries()]
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    linkedAt: user.linkedAt,
    tracking: user.tracking,
  };
}

export function recentPlays(user: QUser, limit = 10): QPlay[] {
  return user.stats.recent.slice(0, limit);
}
