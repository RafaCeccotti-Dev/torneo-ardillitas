import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/auspiciantes");
const NORM = path.join(ROOT, "norm");
const SRC = path.join(ROOT, "punto-mix-src.jpg");

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

function chroma(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

for (let y = 0; y < h; y++) {
  const ny = y / (h - 1);
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const { h: hue, s, l } = hsl(r, g, b);
    const nx = x / (w - 1);
    const c = chroma(r, g, b);

    const inPinCircle = Math.hypot(nx - 0.5, (ny - 0.2) * 1.08) < 0.152;
    const inPinStem = nx > 0.47 && nx < 0.53 && ny > 0.2 && ny < 0.365;
    const inPin = inPinCircle || inPinStem;
    const inMix = ny >= 0.535 && ny <= 0.625 && nx > 0.2 && nx < 0.8;
    const inPunto = ny >= 0.43 && ny <= 0.53 && nx > 0.12 && nx < 0.88;

    const nearWhite = l > 0.78 || (l > 0.55 && c < 40);
    const rainbow =
      s > 0.45 && l > 0.32 && l < 0.92 && !(hue >= 260 && hue <= 310 && l < 0.45);
    const mixNeon =
      s > 0.45 &&
      l > 0.35 &&
      l < 0.9 &&
      ((hue >= 18 && hue <= 68) || hue >= 350 || hue <= 12);

    if (nearWhite && (inPunto || inPin || inMix)) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
      continue;
    }

    if (inPin && rainbow) {
      data[i + 3] = 255;
      continue;
    }

    if (inMix && mixNeon) {
      data[i + 3] = 255;
      continue;
    }

    if (inPunto && l > 0.4 && c < 50) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.min(255, Math.round((l - 0.32) * 1200));
      continue;
    }

    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
  }
}

async function cropBand(ny0, ny1) {
  const top = Math.max(0, Math.floor(ny0 * h));
  const height = Math.min(h - top, Math.ceil((ny1 - ny0) * h));
  const slice = Buffer.alloc(w * height * 4);
  data.copy(slice, 0, top * w * 4, (top + height) * w * 4);
  return sharp(slice, { raw: { width: w, height, channels: 4 } })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();
}

const pinBuf = await cropBand(0.02, 0.4);
const textBuf = await cropBand(0.42, 0.64);

const pinMeta = await sharp(pinBuf).metadata();
const textMeta = await sharp(textBuf).metadata();

const pinH = 210;
const pinW = Math.round((pinMeta.width / pinMeta.height) * pinH);
const pin = await sharp(pinBuf).resize(pinW, pinH).png().toBuffer();

const textH = 188;
const textW = Math.round((textMeta.width / textMeta.height) * textH);
const text = await sharp(textBuf).resize(textW, textH).png().toBuffer();

const gap = 18;
const totalW = pinW + gap + textW;
const left = Math.round((CANVAS_W - totalW) / 2);
const pinTop = Math.round((CANVAS_H - pinH) / 2);
const textTop = Math.round((CANVAS_H - textH) / 2);

await mkdir("tmp-pdf-work", { recursive: true });
const out = path.join(NORM, "punto-mix.png");
await sharp({
  create: {
    width: CANVAS_W,
    height: CANVAS_H,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: pin, left, top: pinTop },
    { input: text, left: left + pinW + gap, top: textTop },
  ])
  .png()
  .toFile(out);

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
  .toFile(path.join("tmp-pdf-work", "_preview-punto-mix.png"));

console.log("ok", { pinW, pinH, textW, textH });
