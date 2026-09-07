import { createCanvas, Image } from "canvas";

const WIDTH = 400;
const HEIGHT = 400;

const FRAMES = [
  { label: "Charging...", boltY: -100, opacity: 0 },
  { label: "⚡ Channeling pure energy... ⚡", boltY: -60, opacity: 0.3 },
  { label: "⚡⚡ THE STORM IS CALLING ⚡⚡", boltY: -20, opacity: 0.6 },
  { label: "⚡⚡⚡ STRIKE INCOMING ⚡⚡⚡", boltY: 20, opacity: 0.8 },
  { label: "⚡⚡⚡⚡⚡ SMITE ⚡⚡⚡⚡⚡", boltY: 60, opacity: 1 },
];

export interface FrameData {
  label: string;
  boltY: number;
  opacity: number;
  buffer: Buffer;
}

export function renderFrame(
  frameIndex: number,
  targetAvatar: Buffer | null
): Buffer {
  const frame = FRAMES[frameIndex] ?? FRAMES[FRAMES.length - 1];
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background - dark stormy gradient
  const gradient = ctx.createRadialGradient(200, 200, 20, 200, 200, 280);
  gradient.addColorStop(0, "#1a0a2e");
  gradient.addColorStop(0.5, "#0d0221");
  gradient.addColorStop(1, "#000000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw target avatar in center
  if (targetAvatar) {
    ctx.save();
    ctx.globalAlpha = 1 - frameIndex * 0.15;
    ctx.beginPath();
    ctx.arc(200, 220, 80, 0, Math.PI * 2);
    ctx.clip();
    const img = new Image();
    img.src = targetAvatar;
    ctx.drawImage(img, 120, 140, 160, 160);
    ctx.restore();
  }

  // Lightning bolt
  ctx.save();
  ctx.globalAlpha = frame.opacity;
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 20;

  // Draw lightning bolt shape
  ctx.beginPath();
  ctx.moveTo(200, frame.boltY);
  ctx.lineTo(180, frame.boltY + 80);
  ctx.lineTo(210, frame.boltY + 80);
  ctx.lineTo(170, frame.boltY + 180);
  ctx.lineTo(220, frame.boltY + 130);
  ctx.lineTo(190, frame.boltY + 130);
  ctx.lineTo(210, frame.boltY + 220);
  ctx.stroke();

  // Glow effect
  ctx.shadowBlur = 40;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Lightning flashes
  if (frameIndex >= 3) {
    ctx.save();
    ctx.globalAlpha = frameIndex === 3 ? 0.1 : 0.2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  // Electric sparks
  if (frameIndex >= 2) {
    ctx.save();
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1;
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 10;
    for (let i = 0; i < frameIndex * 3; i++) {
      const x = 50 + Math.random() * 300;
      const y = 50 + Math.random() * 300;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bottom text overlay (on image)
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, HEIGHT - 50, WIDTH, 50);
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(frame.label, WIDTH / 2, HEIGHT - 20);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

export function getFrameCount(): number {
  return FRAMES.length;
}

export function getFrameLabel(frameIndex: number): string {
  return FRAMES[frameIndex]?.label ?? FRAMES[FRAMES.length - 1].label;
}
