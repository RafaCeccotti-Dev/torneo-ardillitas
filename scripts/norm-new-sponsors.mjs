import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/auspiciantes");
const NORM = path.join(ROOT, "norm");
const ASSETS = String.raw`C:\Users\PC\.cursor\projects\c-Users-PC-Desktop-Proyectos\assets`;

const CANVAS_W = 640;
const CANVAS_H = 256;

function hsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function distWhite(r, g, b) {
  return 255 - r + (255 - g) + (255 - b);
}

function processPixels(data, w, h, decide) {
  for (let y = 0; y < h; y++) {
    const ny = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const { h: hue, s, l } = hsl(r, g, b);
      const dw = distWhite(r, g, b);
      const nx = x / (w - 1);
      const action = decide({ r, g, b, hue, s, l, dw, nx, ny, x, y });
      if (action === "clear") {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      } else if (action === "keep") {
        const a = Math.min(255, Math.max(data[i + 3], Math.round(dw * 2.4)));
        data[i + 3] = a;
      } else {
        const a = Math.min(255, Math.round(dw * 2.15));
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = a;
      }
    }
  }
}

async function bboxTrim(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (distWhite(data[i], data[i + 1], data[i + 2]) > 18) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  return sharp(inputPath)
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .ensureAlpha();
}

async function toCanvas(buf) {
  const meta = await sharp(buf).metadata();
  const maxW = CANVAS_W - 36;
  const maxH = CANVAS_H - 20;
  const scale = Math.min(maxW / meta.width, maxH / meta.height);
  const nw = Math.max(1, Math.round(meta.width * scale));
  const nh = Math.max(1, Math.round(meta.height * scale));
  const resized = await sharp(buf).resize(nw, nh).png().toBuffer();
  return sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: "centre" }])
    .png();
}

async function finish(processed, outName) {
  const trimmed = await sharp(processed).trim({ threshold: 8 }).png().toBuffer();
  const canvas = await toCanvas(trimmed);
  const out = path.join(NORM, outName);
  await canvas.toFile(out);
  const preview = path.join(NORM, `_preview-${outName}`);
  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 },
    },
  })
    .composite([{ input: out, gravity: "centre" }])
    .png()
    .toFile(preview);
  return out;
}

async function runOne(src, outName, decide) {
  const trimmed = await bboxTrim(src);
  const { data, info } = await trimmed.raw().toBuffer({ resolveWithObject: true });
  processPixels(data, info.width, info.height, decide);
  const processed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  return finish(processed, outName);
}

function isPink(r, g, b) {
  const { h, s, l } = hsl(r, g, b);
  return (h >= 318 || h <= 18) && s > 0.32 && l > 0.28 && l < 0.78;
}

function nearPink(src, w, h, x, y, radius) {
  let pink = 0;
  let total = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const i = (yy * w + xx) * 4;
      total++;
      if (isPink(src[i], src[i + 1], src[i + 2])) pink++;
    }
  }
  return total > 0 && pink / total > 0.18;
}

function floodClear(data, w, h, seeds, match) {
  const seen = new Uint8Array(w * h);
  const stack = seeds.slice();
  while (stack.length) {
    const { x, y } = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const idx = y * w + x;
    if (seen[idx]) continue;
    seen[idx] = 1;
    const i = idx * 4;
    if (!match(data[i], data[i + 1], data[i + 2])) continue;
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
    stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
  }
}

async function runSanLorenzo(src, outName) {
  const trimmed = await bboxTrim(src);
  const { data, info } = await trimmed.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const orig = Buffer.from(data);

  const isYellowFill = (r, g, b) => {
    const { h: hue, s, l } = hsl(r, g, b);
    return hue >= 28 && hue <= 72 && s > 0.15 && l > 0.42;
  };
  const isCyanFill = (r, g, b) => {
    const { h: hue, s, l } = hsl(r, g, b);
    return hue >= 160 && hue <= 225 && s > 0.08 && l > 0.42;
  };

  floodClear(data, w, h, [{ x: Math.round(w * 0.5), y: Math.round(h * 0.28) }], isYellowFill);
  floodClear(data, w, h, [{ x: Math.round(w * 0.5), y: Math.round(h * 0.82) }], isCyanFill);

  for (let y = 0; y < h; y++) {
    const ny = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] === 0) continue;
      const r = orig[i];
      const g = orig[i + 1];
      const b = orig[i + 2];
      const dw = distWhite(r, g, b);
      const { h: hue, s, l } = hsl(r, g, b);
      if (dw < 16) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
        continue;
      }
      const nameYellow =
        ny >= 0.5 && ny <= 0.74 && hue >= 32 && hue <= 68 && s > 0.25 && l > 0.32 && l < 0.85;
      if (nameYellow) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
        continue;
      }
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = ny > 0.72 ? 255 : Math.min(255, Math.round(dw * 2.4));
    }
  }

  const processed = await sharp(data, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();
  return finish(processed, outName);
}

async function runFlorecita(src, outName) {
  const trimmed = await bboxTrim(src);
  const { data, info } = await trimmed.raw().toBuffer({ resolveWithObject: true });
  const orig = Buffer.from(data);
  const { width: w, height: h } = info;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = orig[i];
      const g = orig[i + 1];
      const b = orig[i + 2];
      const dw = distWhite(r, g, b);
      if (isPink(r, g, b)) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = Math.min(255, Math.max(orig[i + 3], Math.round(dw * 2.4)));
        continue;
      }
      if (dw < 28 && nearPink(orig, w, h, x, y, 14)) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
        continue;
      }
      if (dw < 22) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
        continue;
      }
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.min(255, Math.round(dw * 2.15));
    }
  }
  const processed = await sharp(data, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();
  return finish(processed, outName);
}

const sources = {
  piruetas: path.join(ASSETS, "WhatsApp_Image_2026-11-20_at_11.34.24-60d7f370-830e-4290-9ec6-414b79d11aaa.jpg"),
  florecita: path.join(ASSETS, "WhatsApp_Image_2026-11-20_at_11.34.24__1_-4755264d-10d5-455b-80b8-acbf55fb6f28.jpg"),
  sanLorenzo: path.join(ASSETS, "WhatsApp_Image_2026-11-20_at_11.34.24__2_-46387c90-7f9a-4e14-a56d-4f30fa40919b.jpg"),
};

await mkdir(NORM, { recursive: true });
await copyFile(sources.piruetas, path.join(ROOT, "piruetas-src.jpg"));
await copyFile(sources.florecita, path.join(ROOT, "florecita-src.jpg"));
await copyFile(sources.sanLorenzo, path.join(ROOT, "san-lorenzo-src.jpg"));

await runOne(sources.piruetas, "piruetas.png", ({ dw, hue, s, l, nx, ny }) => {
  if (dw < 22) return "clear";
  const dist = Math.hypot(nx - 0.5, ny - 0.5);
  if (dist > 0.435) return "white";
  const rainbow = ny < 0.48 && s > 0.16 && l > 0.32 && l < 0.93;
  const heart = ny > 0.78 && s > 0.22 && (hue >= 320 || hue <= 20);
  if (rainbow || heart) return "keep";
  return "white";
});

await runFlorecita(sources.florecita, "florecita.png");

await runOne(sources.sanLorenzo, "san-lorenzo.png", ({ dw, hue, s, l, nx, ny }) => {
  if (dw < 16) return "clear";
  const dist = Math.hypot(nx - 0.5, ny - 0.5);
  if (ny > 0.76 && dist < 0.44) return "clear";
  const yellowFill = hue >= 28 && hue <= 72 && s > 0.4 && l > 0.42 && ny < 0.5;
  const cyanFill = hue >= 170 && hue <= 220 && s > 0.25 && l > 0.5;
  if (yellowFill || cyanFill) return "clear";
  const nameYellow =
    ny >= 0.5 && ny <= 0.74 && hue >= 32 && hue <= 68 && s > 0.4 && l > 0.35 && l < 0.78;
  if (nameYellow) return "keep";
  return "white";
});

console.log("ok");
