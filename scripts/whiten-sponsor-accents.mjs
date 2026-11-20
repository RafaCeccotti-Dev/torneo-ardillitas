import { writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const NORM = path.resolve("public/auspiciantes/norm");
const TMP = path.resolve("tmp-pdf-work");
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

function contentBbox(data, w, h) {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 20) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

function toWhite(data, i) {
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
}

function clear(data, i) {
  data[i] = 0;
  data[i + 1] = 0;
  data[i + 2] = 0;
  data[i + 3] = 0;
}

function isColorful(r, g, b, a) {
  if (a < 20) return false;
  const { s, l } = hsl(r, g, b);
  return s > 0.18 && l > 0.12 && l < 0.92 && chroma(r, g, b) > 28;
}

async function load(name) {
  const file = path.join(NORM, name);
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, file };
}

async function save(name, data, w, h) {
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
  writeFileSync(path.join(NORM, name), png);
  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 },
    },
  })
    .composite([{ input: png, gravity: "centre" }])
    .png()
    .toFile(path.join(TMP, `_preview-${name}`));
}

async function piruetas() {
  const { data, w, h } = await load("piruetas.png");
  const box = contentBBoxSafe(data, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (!isColorful(r, g, b, a)) continue;
      const ny = (y - box.minY) / Math.max(1, box.maxY - box.minY);
      const { h: hue, s } = hsl(r, g, b);
      const heart = ny > 0.78 && s > 0.25 && (hue >= 320 || hue <= 20);
      if (heart) continue;
      toWhite(data, i);
    }
  }
  await save("piruetas.png", data, w, h);
}

async function florecita() {
  const { data, w, h } = await load("florecita.png");
  const box = contentBBoxSafe(data, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (!isColorful(r, g, b, a)) continue;
      const nx = (x - box.minX) / Math.max(1, box.maxX - box.minX);
      const ny = (y - box.minY) / Math.max(1, box.maxY - box.minY);
      const balloon = nx > 0.5 && nx < 0.7 && ny < 0.5;
      const sloganBox = nx > 0.52 && ny > 0.28 && ny < 0.72;
      if (sloganBox && !balloon) {
        clear(data, i);
        continue;
      }
      if (balloon) continue;
      toWhite(data, i);
    }
  }
  await save("florecita.png", data, w, h);
}

async function puntoMix() {
  const { data, w, h } = await load("punto-mix.png");
  const box = contentBBoxSafe(data, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (!isColorful(r, g, b, a)) continue;
      const nx = (x - box.minX) / Math.max(1, box.maxX - box.minX);
      const ny = (y - box.minY) / Math.max(1, box.maxY - box.minY);
      const pin = nx < 0.4;
      const mix = nx > 0.42 && ny > 0.48;
      if (pin) {
        toWhite(data, i);
        continue;
      }
      if (mix) continue;
      toWhite(data, i);
    }
  }
  await save("punto-mix.png", data, w, h);
}

async function sanLorenzo() {
  const { data, w, h } = await load("san-lorenzo.png");
  const box = contentBBoxSafe(data, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (!isColorful(r, g, b, a)) continue;
      const ny = (y - box.minY) / Math.max(1, box.maxY - box.minY);
      const line = ny > 0.42 && ny < 0.6;
      if (line) continue;
      toWhite(data, i);
    }
  }
  await save("san-lorenzo.png", data, w, h);
}

async function domo() {
  const { data, w, h } = await load("domo-electronica.png");
  const box = contentBBoxSafe(data, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (!isColorful(r, g, b, a)) continue;
      const nx = (x - box.minX) / Math.max(1, box.maxX - box.minX);
      const dLetter = nx > 0.2 && nx < 0.42;
      if (dLetter) continue;
      toWhite(data, i);
    }
  }
  await save("domo-electronica.png", data, w, h);
}

function contentBBoxSafe(data, w, h) {
  const box = contentBbox(data, w, h);
  if (box.maxX < box.minX) {
    return { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1 };
  }
  return box;
}

await piruetas();
await florecita();
await puntoMix();
await sanLorenzo();
await domo();
console.log("ok");
