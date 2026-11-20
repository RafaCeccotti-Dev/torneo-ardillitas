import { copyFile, mkdir } from "node:fs/promises";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";

const ROOT = path.resolve("public/auspiciantes");
const NORM = path.join(ROOT, "norm");
const TMP = path.resolve("tmp-pdf-work");
const ASSETS = "C:/Users/PC/.cursor/projects/c-Users-PC-Desktop-Proyectos/assets";
const PDF =
  "C:/Users/PC/.cursor/projects/c-Users-PC-Desktop-Proyectos/attachments/daebeef3-be47-4f58-b0eb-a46cec137192/logo_editable_2024.pdf";

const CANVAS_W = 640;
const CANVAS_H = 256;

const boutiqueSrc = path.join(
  ASSETS,
  "WhatsApp_Image_2026-11-20_at_15.27.29-cf994098-a88a-427f-9588-f55e42cfae7d.jpg",
);
const despensaSrc = path.join(
  ASSETS,
  "WhatsApp_Image_2026-11-20_at_15.22.35-9eaa480e-6ac1-4267-aa49-ff0f2c9083a2.jpg",
);

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

async function rasterizePdf() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(readFileSync(PDF));
  const pdf = await pdfjs.getDocument({ data, verbosity: 0 }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 6 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const out = path.join(TMP, "domo-src.png");
  writeFileSync(out, canvas.toBuffer("image/png"));
  return out;
}

async function bboxFromRaw(data, w, h, keep) {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!keep(data, i, x, y, w, h)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const pad = 10;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const slice = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < bh; y++) {
    data.copy(slice, y * bw * 4, ((minY + y) * w + minX) * 4, ((minY + y) * w + minX + bw) * 4);
  }
  return { data: slice, w: bw, h: bh };
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
    .png()
    .toBuffer();
}

async function finish(data, w, h, outName) {
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
  const trimmed = await sharp(png).trim({ threshold: 8 }).png().toBuffer();
  const canvas = await toCanvas(trimmed);
  const out = path.join(NORM, outName);
  writeFileSync(out, canvas);
  await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 },
    },
  })
    .composite([{ input: canvas, gravity: "centre" }])
    .png()
    .toFile(path.join(TMP, `_preview-${outName}`));
  return out;
}

async function loadRaw(src) {
  return sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function boutique(src) {
  const { data, info } = await loadRaw(src);
  const { width: w, height: h } = info;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dw = distWhite(r, g, b);
    if (dw < 28) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = Math.min(255, Math.round((dw - 20) * 1.8));
  }
  const box = await bboxFromRaw(data, w, h, (buf, i) => buf[i + 3] > 12);
  return finish(box.data, box.w, box.h, "boutique-cerdo.png");
}

async function despensa(src) {
  const { data, info } = await loadRaw(src);
  const { width: w, height: h } = info;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const { h: hue, s, l } = hsl(r, g, b);
      const dw = distWhite(r, g, b);
      const orange =
        ((hue >= 8 && hue <= 48) || (hue >= 350 || hue <= 12)) && s > 0.28 && l > 0.28 && l < 0.92;
      if (dw < 22 || (l > 0.9 && s < 0.18)) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
        continue;
      }
      if (orange) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
        continue;
      }
      if (s > 0.12 && l < 0.88) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = Math.min(255, Math.round(dw * 2.2));
        continue;
      }
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
  }
  const box = await bboxFromRaw(data, w, h, (buf, i) => buf[i + 3] > 12);
  return finish(box.data, box.w, box.h, "despensa-san-lorenzo.png");
}

async function domo(src) {
  const { data, info } = await loadRaw(src);
  const { width: w, height: h } = info;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const { h: hue, s, l } = hsl(r, g, b);
      const dw = distWhite(r, g, b);
      if (dw < 18 || l > 0.92) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
        continue;
      }
      const red = (hue <= 22 || hue >= 345) && s > 0.4 && l > 0.22 && l < 0.78;
      if (red) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
        continue;
      }
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.min(255, Math.round(Math.max(40, dw) * 2.1));
    }
  }
  const box = await bboxFromRaw(data, w, h, (buf, i) => buf[i + 3] > 12);
  return finish(box.data, box.w, box.h, "domo-electronica.png");
}

await mkdir(NORM, { recursive: true });
await mkdir(TMP, { recursive: true });
await copyFile(boutiqueSrc, path.join(ROOT, "boutique-cerdo-src.jpg"));
await copyFile(despensaSrc, path.join(ROOT, "despensa-san-lorenzo-src.jpg"));

const domoSrc = await rasterizePdf();
await copyFile(domoSrc, path.join(ROOT, "domo-electronica-src.png"));

await boutique(boutiqueSrc);
await despensa(despensaSrc);
await domo(domoSrc);
console.log("ok");
