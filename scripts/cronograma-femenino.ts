import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import {
  officialFemaleFixtures,
  resolveFemaleName,
  type OfficialFemaleFixture,
} from "../src/data/official-fixtures-femenino";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 32;

const ink = rgb(0.07, 0.07, 0.07);
const muted = rgb(0.42, 0.42, 0.42);
const paper = rgb(1, 1, 1);
const yellow = rgb(0.97, 0.78, 0.1);
const band = rgb(0.1, 0.1, 0.1);
const stripe = rgb(0.96, 0.96, 0.94);
const line = rgb(0.82, 0.82, 0.8);

type Row = {
  time: string;
  court: number;
  home: string;
  away: string;
  category: string;
  knockout: boolean;
};

function latin(font: PDFFont, text: string) {
  const clean = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
  try {
    font.encodeText(clean);
    return clean;
  } catch {
    return clean.replace(/[^\x20-\x7E]/g, "");
  }
}

function fit(font: PDFFont, text: string, size: number, maxWidth: number) {
  let value = latin(font, text);
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  while (value.length > 1 && font.widthOfTextAtSize(`${value}...`, size) > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value.trimEnd()}...`;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function displayName(fixture: OfficialFemaleFixture, raw: string) {
  return resolveFemaleName(fixture, raw) ?? raw;
}

function yearTitle(yearLabel: string) {
  return yearLabel === "2013" ? "2013  ·  SUB 13" : "2011  ·  SUB 15";
}

function collect(fixture: OfficialFemaleFixture): Row[] {
  const rows: Row[] = [];
  for (const match of fixture.groupMatches) {
    const group = match.group ? ` · ${match.group}` : "";
    rows.push({
      time: match.time,
      court: match.court,
      home: displayName(fixture, match.home),
      away: displayName(fixture, match.away),
      category: `${yearTitle(fixture.yearLabel).replace(/\s+/g, " ")}${group}`,
      knockout: false,
    });
  }
  for (const match of fixture.cruces) {
    rows.push({
      time: match.time,
      court: match.court,
      home: match.homeSlot,
      away: match.awaySlot,
      category: match.roundLabel.replace("Copa de ", ""),
      knockout: true,
    });
  }
  return rows.sort((a, b) => {
    const timeDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
    if (timeDiff !== 0) return timeDiff;
    return a.court - b.court;
  });
}

async function main() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage | null = null;
  let y = 0;

  function addPage() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: PAGE_H - 58, width: PAGE_W, height: 58, color: band });
    page.drawRectangle({ x: 0, y: PAGE_H - 62, width: PAGE_W, height: 4, color: yellow });
    page.drawText(latin(bold, "TORNEO ARDILLITAS XVII"), {
      x: MARGIN,
      y: PAGE_H - 32,
      size: 13,
      font: bold,
      color: yellow,
    });
    page.drawText(latin(regular, "Femenino  ·  Domingo 22 de noviembre 2026  ·  Canchas 7 y 8  ·  CCAO Ceres"), {
      x: MARGIN,
      y: PAGE_H - 48,
      size: 8,
      font: regular,
      color: rgb(0.85, 0.85, 0.82),
    });
    y = PAGE_H - 78;
  }

  function ensure(space: number) {
    if (!page || y - space < 28) addPage();
  }

  function scoreBoxes(x: number, width: number) {
    const boxW = 18;
    const gap = 8;
    const start = x + (width - (boxW * 2 + gap)) / 2;
    const boxY = y - 17;
    page!.drawRectangle({
      x: start,
      y: boxY,
      width: boxW,
      height: 12,
      borderColor: rgb(0.55, 0.55, 0.52),
      borderWidth: 0.7,
      color: paper,
    });
    page!.drawText(latin(bold, "-"), {
      x: start + boxW + 1.5,
      y: y - 14,
      size: 8,
      font: bold,
      color: muted,
    });
    page!.drawRectangle({
      x: start + boxW + gap,
      y: boxY,
      width: boxW,
      height: 12,
      borderColor: rgb(0.55, 0.55, 0.52),
      borderWidth: 0.7,
      color: paper,
    });
  }

  function drawSection(title: string, subtitle: string, rows: Row[]) {
    ensure(52);
    page!.drawRectangle({
      x: MARGIN,
      y: y - 28,
      width: PAGE_W - MARGIN * 2,
      height: 32,
      color: yellow,
    });
    page!.drawText(latin(bold, title), {
      x: MARGIN + 8,
      y: y - 14,
      size: 11,
      font: bold,
      color: ink,
    });
    page!.drawText(latin(regular, subtitle), {
      x: MARGIN + 8,
      y: y - 26,
      size: 7.5,
      font: regular,
      color: ink,
    });
    y -= 40;

    const tableW = PAGE_W - MARGIN * 2;
    const cols = { time: 38, court: 36, match: 168, cat: 92, result: 58, pens: 58 };
    const xs = [
      MARGIN,
      MARGIN + cols.time,
      MARGIN + cols.time + cols.court,
      MARGIN + cols.time + cols.court + cols.match,
      MARGIN + cols.time + cols.court + cols.match + cols.cat,
      MARGIN + cols.time + cols.court + cols.match + cols.cat + cols.result,
      MARGIN + cols.time + cols.court + cols.match + cols.cat + cols.result + cols.pens,
      MARGIN + tableW,
    ];
    const rowH = 22;
    const colHeadH = 14;

    ensure(colHeadH + rowH * 2);
    page!.drawRectangle({
      x: MARGIN,
      y: y - colHeadH,
      width: tableW,
      height: colHeadH,
      color: rgb(0.18, 0.18, 0.18),
    });
    const headers = [
      { text: "HORA", x: xs[0] + 5 },
      { text: "CANCHA", x: xs[1] + 3 },
      { text: "PARTIDO", x: xs[2] + 4 },
      { text: "INSTANCIA", x: xs[3] + 3 },
      { text: "RESULTADO", x: xs[4] + 3 },
      { text: "PENALES", x: xs[5] + 6 },
      { text: "FIRMA ARBITRO", x: xs[6] + 4 },
    ];
    for (const header of headers) {
      page!.drawText(latin(bold, header.text), {
        x: header.x,
        y: y - 10,
        size: 6.2,
        font: bold,
        color: yellow,
      });
    }
    for (const x of xs) {
      page!.drawLine({
        start: { x, y },
        end: { x, y: y - colHeadH },
        thickness: 0.45,
        color: rgb(0.45, 0.45, 0.42),
      });
    }
    y -= colHeadH;

    let lastMinutes: number | null = null;
    rows.forEach((row, index) => {
      const minutes = timeToMinutes(row.time);
      const nightGap = lastMinutes != null && minutes - lastMinutes >= 180;
      ensure((nightGap ? 16 : 0) + rowH + 4);

      if (nightGap) {
        page!.drawText(latin(bold, row.knockout ? "— CRUCES —" : "— NOCHE —"), {
          x: MARGIN + 8,
          y: y - 10,
          size: 8,
          font: bold,
          color: muted,
        });
        y -= 16;
      } else if (row.knockout && (lastMinutes == null || lastMinutes < 18 * 60) && minutes >= 19 * 60) {
        ensure(16 + rowH);
        page!.drawText(latin(bold, "— CRUCES —"), {
          x: MARGIN + 8,
          y: y - 10,
          size: 8,
          font: bold,
          color: muted,
        });
        y -= 16;
      }

      const bg = index % 2 === 0 ? paper : stripe;
      page!.drawRectangle({
        x: MARGIN,
        y: y - rowH,
        width: tableW,
        height: rowH,
        color: bg,
      });
      for (const x of xs) {
        page!.drawLine({
          start: { x, y },
          end: { x, y: y - rowH },
          thickness: 0.45,
          color: line,
        });
      }
      page!.drawLine({
        start: { x: MARGIN, y: y - rowH },
        end: { x: PAGE_W - MARGIN, y: y - rowH },
        thickness: 0.45,
        color: line,
      });

      page!.drawText(latin(bold, row.time), {
        x: xs[0] + 4,
        y: y - 14,
        size: 8,
        font: bold,
        color: ink,
      });
      page!.drawText(latin(bold, `C${row.court}`), {
        x: xs[1] + 8,
        y: y - 14,
        size: 8,
        font: bold,
        color: ink,
      });
      page!.drawText(fit(regular, `${row.home} vs ${row.away}`, 7, cols.match - 10), {
        x: xs[2] + 4,
        y: y - 14,
        size: 7,
        font: regular,
        color: ink,
      });
      page!.drawText(fit(regular, row.category, 6.5, cols.cat - 8), {
        x: xs[3] + 3,
        y: y - 14,
        size: 6.5,
        font: regular,
        color: muted,
      });
      scoreBoxes(xs[4], cols.result);
      if (row.knockout) {
        scoreBoxes(xs[5], cols.pens);
      } else {
        page!.drawText(latin(regular, "—"), {
          x: xs[5] + cols.pens / 2 - 3,
          y: y - 14,
          size: 8,
          font: regular,
          color: muted,
        });
      }
      page!.drawLine({
        start: { x: xs[6] + 6, y: y - 16 },
        end: { x: xs[7] - 6, y: y - 16 },
        thickness: 0.5,
        color: rgb(0.62, 0.62, 0.6),
      });
      y -= rowH;
      lastMinutes = minutes;
    });
    y -= 12;
  }

  addPage();
  page!.drawText(
    latin(
      regular,
      "Un solo cronograma: grupos y cruces. Completar RESULTADO y FIRMA. En cruces, si empatan, completar PENALES (serie de 3).",
    ),
    { x: MARGIN, y, size: 8, font: regular, color: muted },
  );
  y -= 18;

  for (const fixture of officialFemaleFixtures) {
    const note =
      fixture.yearLabel === "2013"
        ? "5 equipos · todos contra todos. Final Oro 1 vs 2. Final Plata 3 vs 4. El 5 queda eliminado."
        : "6 equipos · grupos A/B + interzonales. Semis Oro 1 vs 4 y 2 vs 3. Semis Plata: 5 y 6 vs perdedoras de Oro.";
    drawSection(yearTitle(fixture.yearLabel), note, collect(fixture));
  }

  const bytes = Buffer.from(await doc.save());
  const desktop = path.join("C:/Users/PC/Desktop/CRONOGRAMA ARDILLITAS FEMENINO.pdf");
  const proyectos = path.join("C:/Users/PC/Desktop/Proyectos/CRONOGRAMA ARDILLITAS FEMENINO.pdf");
  const local = path.join("tmp-pdf-work/cronograma-femenino.pdf");
  fs.mkdirSync("tmp-pdf-work", { recursive: true });
  fs.writeFileSync(desktop, bytes);
  fs.writeFileSync(proyectos, bytes);
  fs.writeFileSync(local, bytes);
  console.log("ok", bytes.length, desktop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
