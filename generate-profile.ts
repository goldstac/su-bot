import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

const SIZE = 512;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext("2d");

// Background gradient
const gradient = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
gradient.addColorStop(0, "#1a0a2e");
gradient.addColorStop(0.5, "#0d0221");
gradient.addColorStop(1, "#000000");
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, SIZE, SIZE);

// Lightning bolt
ctx.save();
ctx.strokeStyle = "#ffd700";
ctx.lineWidth = 8;
ctx.shadowColor = "#ffd700";
ctx.shadowBlur = 30;
ctx.lineCap = "round";
ctx.lineJoin = "round";

ctx.beginPath();
ctx.moveTo(280, 60);
ctx.lineTo(220, 200);
ctx.lineTo(300, 200);
ctx.lineTo(200, 400);
ctx.lineTo(260, 250);
ctx.lineTo(190, 250);
ctx.lineTo(280, 60);
ctx.stroke();

// Inner glow
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 3;
ctx.shadowBlur = 15;
ctx.stroke();
ctx.restore();

// "SU" text
ctx.save();
ctx.fillStyle = "#ffd700";
ctx.font = "bold 100px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.shadowColor = "#ffd700";
ctx.shadowBlur = 20;
ctx.fillText("SU", 256, 280);
ctx.restore();

// Save
const buffer = canvas.toBuffer("image/png");
writeFileSync("profile.png", buffer);
console.log("✅ profile.png created!");
