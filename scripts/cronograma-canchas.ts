import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import {
  normalizeTeamKey,
  officialFixtures,
  type OfficialYearFixture,
} from "../src/data/official-fixtures-2015-2017";
import { officialFixtures2018_2019 } from "../src/data/official-fixtures-2018-2019";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 34;
const COURTS = [1, 2, 3, 4, 5, 6] as const;

const ink = rgb(0.07, 0.07, 0.07);
const muted = rgb(0.42, 0.42, 0.42);
const paper = rgb(1, 1, 1);
const yellow = rgb(0.97, 0.78, 0.1);
const band = rgb(0.1, 0.1, 0.1);
const stripe = rgb(0.96, 0.96, 0.94);
const line = rgb(0.82, 0.82, 0.8);

type DayKey = "sabado" | "domingo" | "lunes";

type CourtMatch = {
  time: string;
  home: string;
  away: string;
  category: string;
  knockout?: boolean;
};

const DAYS: { key: DayKey; title: string; subtitle: string }[] = [
  { key: "sabado", title: "SÁBADO 21 DE NOVIEMBRE", subtitle: "Fase de grupos · partidos de cada cancha" },
  { key: "domingo", title: "DOMINGO 22 DE NOVIEMBRE", subtitle: "Fase de grupos · partidos de cada cancha" },
  { key: "lunes", title: "LUNES 23 DE NOVIEMBRE", subtitle: "Cruces · cuartos, semis y finales · Oro y Plata" },
];

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

function displayName(fixture: OfficialYearFixture, raw: string) {
  return fixture.aliases[normalizeTeamKey(raw)] ?? raw;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function pushMatch(
  store: Map<DayKey, Map<number, CourtMatch[]>>,
  day: DayKey,
  court: number,
  match: CourtMatch,
) {
  if (!store.has(day)) store.set(day, new Map());
  const byCourt = store.get(day)!;
  const list = byCourt.get(court) ?? [];
  list.push(match);
  byCourt.set(court, list);
}

function collectByCourt() {
  const store = new Map<DayKey, Map<number, CourtMatch[]>>();
  const fixtures = [...officialFixtures, ...officialFixtures2018_2019];

  for (const fixture of fixtures) {
    for (const match of fixture.groupMatches) {
      pushMatch(store, match.day, match.court, {
        time: match.time,
        home: displayName(fixture, match.home),
        away: displayName(fixture, match.away),
        category: `${fixture.yearLabel} · Gpo ${match.group}`,
      });
    }
    for (const match of [...fixture.oro, ...fixture.plata]) {
      const cup = /plata/i.test(match.roundLabel) ? "Copa de Plata" : "Copa de Oro";
      pushMatch(store, "lunes", match.court, {
        time: match.time,
        home: match.homeSlot,
        away: match.awaySlot,
        category: `${fixture.yearLabel} · ${cup}`,
        knockout: true,
      });
    }
  }

  for (const byCourt of store.values()) {
    for (const [court, list] of byCourt) {
      list.sort((a, b) => {
        const timeDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
        if (timeDiff !== 0) return timeDiff;
        return a.category.localeCompare(b.category, "es");
      });
      byCourt.set(court, list);
    }
  }

  return store;
}

async function main() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage | null = null;
  let y = 0;

  function addPage() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - 22;
    page.drawRectangle({ x: 0, y: PAGE_H - 58, width: PAGE_W, height: 58, color: band });
    page.drawRectangle({ x: 0, y: PAGE_H - 62, width: PAGE_W, height: 4, color: yellow });
    page.drawText(latin(bold, "TORNEO ARDILLITAS XVII"), {
      x: MARGIN,
      y: PAGE_H - 32,
      size: 13,
      font: bold,
      color: yellow,
    });
    page.drawText(latin(regular, "Cronograma por cancha  ·  21, 22 y 23 de noviembre 2026  ·  CCAO Ceres"), {
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

  function drawDayTitle(title: string, subtitle: string) {
    ensure(48);
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
      size: 8,
      font: regular,
      color: ink,
    });
    y -= 42;
  }

  function drawCourt(court: number, matches: CourtMatch[], withPens: boolean) {
    const tableW = PAGE_W - MARGIN * 2;
    const cols = withPens
      ? { time: 36, match: 168, cat: 78, result: 62, pens: 62, sign: tableW - 36 - 168 - 78 - 62 - 62 }
      : { time: 40, match: 198, cat: 92, result: 74, sign: tableW - 40 - 198 - 92 - 74, pens: 0 };
    const xs = withPens
      ? [
          MARGIN,
          MARGIN + cols.time,
          MARGIN + cols.time + cols.match,
          MARGIN + cols.time + cols.match + cols.cat,
          MARGIN + cols.time + cols.match + cols.cat + cols.result,
          MARGIN + cols.time + cols.match + cols.cat + cols.result + cols.pens,
          MARGIN + tableW,
        ]
      : [
          MARGIN,
          MARGIN + cols.time,
          MARGIN + cols.time + cols.match,
          MARGIN + cols.time + cols.match + cols.cat,
          MARGIN + cols.time + cols.match + cols.cat + cols.result,
          MARGIN + tableW,
        ];
    const rowH = 22;
    const colHeadH = 14;
    const headerH = 18;
    ensure(headerH + colHeadH + Math.min(matches.length, 3) * rowH + 12);

    page!.drawRectangle({
      x: MARGIN,
      y: y - headerH,
      width: tableW,
      height: headerH,
      color: band,
    });
    page!.drawText(latin(bold, `CANCHA ${court}`), {
      x: MARGIN + 8,
      y: y - 13,
      size: 10,
      font: bold,
      color: yellow,
    });
    page!.drawText(latin(regular, `${matches.length} partido${matches.length === 1 ? "" : "s"}`), {
      x: PAGE_W - MARGIN - 78,
      y: y - 13,
      size: 8,
      font: regular,
      color: rgb(0.85, 0.85, 0.82),
    });
    y -= headerH;

    page!.drawRectangle({
      x: MARGIN,
      y: y - colHeadH,
      width: tableW,
      height: colHeadH,
      color: rgb(0.18, 0.18, 0.18),
    });
    const headers = withPens
      ? [
          { text: "HORA", x: xs[0] + 4 },
          { text: "PARTIDO", x: xs[1] + 4 },
          { text: "CATEGORIA", x: xs[2] + 3 },
          { text: "RESULTADO", x: xs[3] + 4 },
          { text: "PENALES", x: xs[4] + 6 },
          { text: "FIRMA ARBITRO", x: xs[5] + 4 },
        ]
      : [
          { text: "HORA", x: xs[0] + 6 },
          { text: "PARTIDO", x: xs[1] + 6 },
          { text: "CATEGORIA", x: xs[2] + 4 },
          { text: "RESULTADO", x: xs[3] + 6 },
          { text: "FIRMA ARBITRO", x: xs[4] + 6 },
        ];
    for (const header of headers) {
      page!.drawText(latin(bold, header.text), {
        x: header.x,
        y: y - 10,
        size: 6.5,
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
    matches.forEach((match, index) => {
      const minutes = timeToMinutes(match.time);
      const nightGap = lastMinutes != null && minutes - lastMinutes >= 180;
      ensure((nightGap ? 16 : 0) + rowH + 4);

      if (nightGap) {
        page!.drawText(latin(bold, "— NOCHE —"), {
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

      page!.drawText(latin(bold, match.time), {
        x: xs[0] + 5,
        y: y - 14,
        size: 8,
        font: bold,
        color: ink,
      });

      const versus = `${match.home} vs ${match.away}`;
      page!.drawText(fit(regular, versus, 7.5, cols.match - 12), {
        x: xs[1] + 5,
        y: y - 14,
        size: 7.5,
        font: regular,
        color: ink,
      });
      page!.drawText(fit(regular, match.category, 7, cols.cat - 10), {
        x: xs[2] + 4,
        y: y - 14,
        size: 7,
        font: regular,
        color: muted,
      });

      function scoreBoxes(colIndex: number, colWidth: number) {
        const boxW = 18;
        const gap = 8;
        const start = xs[colIndex] + (colWidth - (boxW * 2 + gap)) / 2;
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

      scoreBoxes(3, cols.result);
      if (withPens) scoreBoxes(4, cols.pens);

      const signLeft = withPens ? xs[5] : xs[4];
      const signRight = withPens ? xs[6] : xs[5];
      page!.drawLine({
        start: { x: signLeft + 8, y: y - 16 },
        end: { x: signRight - 8, y: y - 16 },
        thickness: 0.5,
        color: rgb(0.62, 0.62, 0.6),
      });

      y -= rowH;
      lastMinutes = minutes;
    });
    y -= 10;
  }

  addPage();
  page!.drawText(
    latin(
      regular,
      "Completar RESULTADO y FIRMA ARBITRO. El lunes, si hay empate en cruces, completar tambien PENALES (tiene que haber un ganador).",
    ),
    { x: MARGIN, y, size: 8, font: regular, color: muted },
  );
  y -= 16;

  const byDay = collectByCourt();
  for (const day of DAYS) {
    drawDayTitle(day.title, day.subtitle);
    const byCourt = byDay.get(day.key) ?? new Map<number, CourtMatch[]>();
    for (const court of COURTS) {
      const matches = byCourt.get(court) ?? [];
      if (!matches.length) continue;
      drawCourt(court, matches, day.key === "lunes");
    }
  }

  const bytes = Buffer.from(await doc.save());
  const desktop = path.join("C:/Users/PC/Desktop/CRONOGRAMA ARDILLITAS POR CANCHAS.pdf");
  const proyectos = path.join("C:/Users/PC/Desktop/Proyectos/CRONOGRAMA ARDILLITAS POR CANCHAS.pdf");
  const local = path.join("tmp-pdf-work/cronograma-por-canchas.pdf");
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
