// ─────────────────────────────────────────────
//  BOT STATE - runtime status, maintenance, features
// ─────────────────────────────────────────────

export const STARTED_AT = Date.now();
export const VERSION = "3.0.0";

export const botState = {
  maintenance: false,
  maintenanceReason: "",
  features: [
    { name: "⚡ Smite", desc: "Animated lightning smiting", emoji: "⚡" },
    { name: "🎭 LARP System", desc: "The ultimate transformation experience", emoji: "🎭" },
    { name: "🎰 Minigames", desc: "Slots, coinflip, dice, trivia & more", emoji: "🎰" },
    { name: "💤 AFK System", desc: "AFK notices when users return", emoji: "💤" },
    { name: "🔧 SU Client CLI", desc: "Remote bot control from your terminal", emoji: "🔧" },
  ],
};

export function setMaintenance(enabled: boolean, reason = ""): void {
  botState.maintenance = enabled;
  botState.maintenanceReason = enabled ? reason || "Scheduled maintenance" : "";
}

export function addFeature(name: string, desc: string, emoji = "🆕"): boolean {
  if (botState.features.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
    return false;
  }
  botState.features.push({ name, desc, emoji });
  return true;
}

export function removeFeature(name: string): boolean {
  const idx = botState.features.findIndex(
    (f) => f.name.toLowerCase() === name.toLowerCase() || f.name.toLowerCase().includes(name.toLowerCase())
  );
  if (idx === -1) return false;
  botState.features.splice(idx, 1);
  return true;
}

export function uptimeString(): string {
  const secs = Math.floor((Date.now() - STARTED_AT) / 1000);
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (d || h) parts.push(`${h}h`);
  if (d || h || m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}
