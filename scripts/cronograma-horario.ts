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
const libreGray = rgb(0.55, 0.55, 0.55);
const line = rgb(0.82, 0.82, 0.8);

type DayKey = "sabado" | "domingo" | "lunes";

type SlotMatch = {
  court: number;
  home: string;
  away: string;
  category: string;
};

const DAYS: { key: DayKey; title: string; subtitle: string }[] = [
  { key: "sabado", title: "SÁBADO 21 DE NOVIEMBRE", subtitle: "Fase de grupos · todas las categorías" },
  { key: "domingo", title: "DOMINGO 22 DE NOVIEMBRE", subtitle: "Fase de grupos · todas las categorías" },
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

function collectGroupSlots() {
  const byDay = new Map<DayKey, Map<string, SlotMatch[]>>();
  for (const key of ["sabado", "domingo"] as DayKey[]) {
    byDay.set(key, new Map());
  }

  const fixtures = [...officialFixtures, ...officialFixtures2018_2019];
  for (const fixture of fixtures) {
    for (const match of fixture.groupMatches) {
      const times = byDay.get(match.day)!;
      const list = times.get(match.time) ?? [];
      list.push({
        court: match.court,
        home: displayName(fixture, match.home),
        away: displayName(fixture, match.away),
        category: `${fixture.yearLabel} · Gpo ${match.group}`,
      });
      times.set(match.time, list);
    }
  }
  return byDay;
}

function collectLunesByYear() {
  const fixtures = [...officialFixtures, ...officialFixtures2018_2019];
  return fixtures.map((fixture) => {
    const times = new Map<string, SlotMatch[]>();
    for (const match of [...fixture.oro, ...fixture.plata]) {
      const cup = /plata/i.test(match.roundLabel) ? "Copa de Plata" : "Copa de Oro";
      const list = times.get(match.time) ?? [];
      list.push({
        court: match.court,
        home: match.homeSlot,
        away: match.awaySlot,
        category: `${fixture.yearLabel} · ${cup}`,
      });
      times.set(match.time, list);
    }
    return { yearLabel: fixture.yearLabel, times };
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
    page.drawText(latin(regular, "Cronograma por horario  ·  21, 22 y 23 de noviembre 2026  ·  CCAO Ceres"), {
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

  function drawSlot(time: string, matches: SlotMatch[]) {
    const rowH = 15;
    const block = 18 + COURTS.length * rowH + 8;
    ensure(block);

    page!.drawRectangle({
      x: MARGIN,
      y: y - 16,
      width: PAGE_W - MARGIN * 2,
      height: 16,
      color: band,
    });
    page!.drawText(latin(bold, `${time} hs`), {
      x: MARGIN + 8,
      y: y - 12,
      size: 10,
      font: bold,
      color: yellow,
    });
    y -= 16;

    const byCourt = new Map<number, SlotMatch[]>();
    for (const match of matches) {
      const list = byCourt.get(match.court) ?? [];
      list.push(match);
      byCourt.set(match.court, list);
    }

    for (const court of COURTS) {
      const occupying = byCourt.get(court) ?? [];
      const bg = court % 2 === 0 ? stripe : paper;
      page!.drawRectangle({
        x: MARGIN,
        y: y - rowH,
        width: PAGE_W - MARGIN * 2,
        height: rowH,
        color: bg,
      });
      page!.drawLine({
        start: { x: MARGIN, y: y - rowH },
        end: { x: PAGE_W - MARGIN, y: y - rowH },
        thickness: 0.4,
        color: line,
      });

      const labelX = MARGIN + 8;
      const label = `Cancha ${court}:`;
      page!.drawText(latin(bold, label), {
        x: labelX,
        y: y - 11,
        size: 8.5,
        font: bold,
        color: ink,
      });
      const textX = labelX + 58;
      const maxW = PAGE_W - MARGIN - textX - 6;

      if (!occupying.length) {
        page!.drawText(latin(bold, "LIBRE"), {
          x: textX,
          y: y - 11,
          size: 8.5,
          font: bold,
          color: libreGray,
        });
      } else {
        const text = occupying
          .map((item) => `${item.home} vs ${item.away}  ·  ${item.category}`)
          .join("  |  ");
        page!.drawText(fit(regular, text, 8, maxW), {
          x: textX,
          y: y - 11,
          size: 8,
          font: regular,
          color: ink,
        });
      }
      y -= rowH;
    }
    y -= 8;
  }

  addPage();
  page!.drawText(latin(regular, "En cada horario se marcan las 6 canchas. Si no hay partido, figura LIBRE."), {
    x: MARGIN,
    y,
    size: 8,
    font: regular,
    color: muted,
  });
  y -= 16;

  const groupSlots = collectGroupSlots();
  for (const day of DAYS) {
    drawDayTitle(day.title, day.subtitle);
    const times = [...(groupSlots.get(day.key)?.keys() ?? [])].sort(
      (a, b) => timeToMinutes(a) - timeToMinutes(b),
    );
    let lastMinutes: number | null = null;
    for (const time of times) {
      const minutes = timeToMinutes(time);
      if (lastMinutes != null && minutes - lastMinutes >= 180) {
        ensure(18);
        page!.drawText(latin(bold, "— NOCHE —"), {
          x: MARGIN,
          y: y - 8,
          size: 8,
          font: bold,
          color: muted,
        });
        y -= 16;
      }
      drawSlot(time, groupSlots.get(day.key)!.get(time) ?? []);
      lastMinutes = minutes;
    }
  }

  addPage();
  drawDayTitle("LUNES 23 DE NOVIEMBRE", "Cruces · cuartos, semis y finales de Oro y Plata");
  page!.drawText(
    latin(
      regular,
      "Cada categoria usa el mismo esquema. Cuartos a la manana, semis/final de Oro al mediodia, Plata a la tarde/noche.",
    ),
    { x: MARGIN, y, size: 8, font: regular, color: muted },
  );
  y -= 16;

  for (const year of collectLunesByYear()) {
    ensure(28);
    page!.drawText(latin(bold, `CATEGORIA ${year.yearLabel}`), {
      x: MARGIN,
      y: y - 4,
      size: 10,
      font: bold,
      color: ink,
    });
    y -= 16;
    const times = [...year.times.keys()].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    let lastMinutes: number | null = null;
    for (const time of times) {
      const minutes = timeToMinutes(time);
      if (lastMinutes != null && minutes - lastMinutes >= 120) {
        ensure(16);
        page!.drawText(latin(bold, "— COPA DE PLATA —"), {
          x: MARGIN,
          y: y - 6,
          size: 8,
          font: bold,
          color: muted,
        });
        y -= 14;
      }
      drawSlot(time, year.times.get(time) ?? []);
      lastMinutes = minutes;
    }
  }

  const bytes = Buffer.from(await doc.save());
  const desktop = path.join("C:/Users/PC/Desktop/CRONOGRAMA ARDILLITAS.pdf");
  const proyectos = path.join("C:/Users/PC/Desktop/Proyectos/CRONOGRAMA ARDILLITAS.pdf");
  const local = path.join("tmp-pdf-work/cronograma-por-horario.pdf");
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
