import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { formatBirthDateDisplay, MAX_STAFF_PER_CATEGORY, type StaffRole } from "@/lib/accreditation";
import { LISTA_BUENA_FE_TEMPLATE_PDF_BASE64 } from "@/lib/lista-buena-fe-template";

export type RosterPdfPlayer = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  jerseyNumber: number | string | null;
};

export function parseJerseyNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export type RosterPdfStaff = {
  role: StaffRole;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
};

export type RosterPdfInput = {
  clubName: string;
  categoryLabel: string;
  players: RosterPdfPlayer[];
  staff: RosterPdfStaff[];
};

const PAGE_HEIGHT = 841.89;
const PAGE_RIGHT = 568;

const JERSEY_LEFT = 47.5;
const JERSEY_RIGHT = 75.4;
const HEADER_BOTTOM = 222.8;
const ROW_HEIGHT = 24.1;
const ROW_TEXT_OFFSET = 13.2;

const TABLE_COLUMNS = [JERSEY_LEFT, JERSEY_RIGHT, 259.8, 367, 474, 581];

const FIELD_Y = {
  equipo: 86,
  dt1: 106,
  dt2: 127,
  categoria: 145,
};

const FIELD_X = {
  equipo: 128,
  dt: 158,
  categoria: 372,
};

const YEARS = ["2015", "2016", "2017", "2018", "2019"] as const;
const CHIP_X = [47, 143, 239.5, 335.5, 430];
const CHIP_W = [88, 88, 88, 88, 82];
const CHIP_TOP = 157.2;
const CHIP_BOTTOM = 170.8;
const CHIP_BASELINE = 166.5;

const DELEGATE_ROLE_ORDER: StaffRole[] = ["dt", "delegado", "ayudante", "otro", "medico"];

const black = rgb(0, 0, 0);
const white = rgb(1, 1, 1);
const yellow = rgb(1, 0.82, 0.12);

function fromTop(y: number) {
  return PAGE_HEIGHT - y;
}

function rowTop(index: number) {
  return HEADER_BOTTOM + index * ROW_HEIGHT;
}

function toWinAnsi(font: PDFFont, text: string) {
  try {
    font.encodeText(text);
    return text;
  } catch {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "");
  }
}

function fitText(font: PDFFont, text: string, size: number, maxWidth: number) {
  let value = toWinAnsi(font, text.trim());
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  while (value.length > 1 && font.widthOfTextAtSize(`${value}...`, size) > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value.trimEnd()}...`;
}

function drawFilled(
  page: PDFPage,
  font: PDFFont,
  value: string,
  x: number,
  baselineTop: number,
  maxWidth: number,
) {
  if (!value) return;
  page.drawText(fitText(font, value, 11, maxWidth), {
    x,
    y: fromTop(baselineTop),
    size: 11,
    font,
    color: black,
  });
}

function centerText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  width: number,
  baselineTop: number,
  size: number,
) {
  const value = toWinAnsi(font, text);
  const w = font.widthOfTextAtSize(value, size);
  page.drawText(value, {
    x: x + Math.max(0, (width - w) / 2),
    y: fromTop(baselineTop),
    size,
    font,
    color: black,
  });
}

function describeStaff(member: RosterPdfStaff) {
  return [
    `${member.firstName} ${member.lastName}`.trim(),
    member.dni ? `DNI ${member.dni}` : "",
    member.phone ? `Tel. ${member.phone}` : "",
  ]
    .filter(Boolean)
    .join(" - ");
}

function pickDelegates(staff: RosterPdfStaff[]) {
  return [...staff]
    .sort(
      (a, b) => DELEGATE_ROLE_ORDER.indexOf(a.role) - DELEGATE_ROLE_ORDER.indexOf(b.role),
    )
    .slice(0, MAX_STAFF_PER_CATEGORY);
}

function chipYearFromLabel(categoryLabel: string) {
  if (/2019\s*\/\s*2020/.test(categoryLabel)) return "2019";
  return categoryLabel.match(/\b(201[5-9])\b/)?.[1] ?? null;
}

function playerCountLabel(count: number) {
  return count === 1 ? "(1 Jugador)" : `(${count} Jugadores)`;
}

function coverChipRow(page: PDFPage) {
  page.drawRectangle({
    x: 40,
    y: fromTop(CHIP_BOTTOM + 0.6),
    width: 500,
    height: CHIP_BOTTOM - CHIP_TOP + 1.6,
    color: white,
  });
}

function markCategoryYear(page: PDFPage, font: PDFFont, categoryLabel: string, playerCount: number) {
  coverChipRow(page);
  const selected = chipYearFromLabel(categoryLabel);

  for (let i = 0; i < YEARS.length; i++) {
    const year = YEARS[i];
    const x = CHIP_X[i];
    const width = CHIP_W[i];
    const isSelected = year === selected;
    const label = isSelected ? `${year} ${playerCountLabel(playerCount)}` : year;

    if (isSelected) {
      page.drawRectangle({
        x: x - 1,
        y: fromTop(CHIP_BOTTOM),
        width: width + 2,
        height: CHIP_BOTTOM - CHIP_TOP,
        color: yellow,
        borderColor: black,
        borderWidth: 1,
      });
    }

    let size = isSelected ? 7.2 : 9;
    const encoded = toWinAnsi(font, label);
    while (size > 5.6 && font.widthOfTextAtSize(encoded, size) > width - 4) {
      size -= 0.15;
    }
    centerText(page, font, encoded, x, width, CHIP_BASELINE, size);

    if (i < YEARS.length - 1) {
      page.drawText("•", {
        x: x + width + 1.6,
        y: fromTop(CHIP_BASELINE),
        size: 8,
        font,
        color: black,
      });
    }
  }
}

function drawCategoryField(page: PDFPage, font: PDFFont, categoryLabel: string) {
  const text = toWinAnsi(font, categoryLabel.trim());
  if (!text) return;

  let size = 11;
  let width = font.widthOfTextAtSize(text, size);
  const minX = 318;
  while (size > 8 && width > PAGE_RIGHT - minX) {
    size -= 0.25;
    width = font.widthOfTextAtSize(text, size);
  }

  const x = width <= PAGE_RIGHT - FIELD_X.categoria ? FIELD_X.categoria : Math.max(minX, PAGE_RIGHT - width);
  page.drawText(text, {
    x,
    y: fromTop(FIELD_Y.categoria),
    size,
    font,
    color: black,
  });
}

function coverPrintedJerseys(page: PDFPage) {
  const insetX = 1.45;
  const insetY = 1.1;
  for (let i = 0; i < 14; i++) {
    const top = rowTop(i);
    const bottom = rowTop(i + 1);
    page.drawRectangle({
      x: JERSEY_LEFT + insetX,
      y: fromTop(bottom - insetY),
      width: JERSEY_RIGHT - JERSEY_LEFT - insetX * 2,
      height: bottom - top - insetY * 2,
      color: white,
    });
  }
}

function drawJerseyHeader(page: PDFPage, bold: PDFFont) {
  const width = JERSEY_RIGHT - JERSEY_LEFT;
  const nro = toWinAnsi(bold, "Nº");
  const cam = toWinAnsi(bold, "Camiseta");
  page.drawText(nro, {
    x: JERSEY_LEFT + (width - bold.widthOfTextAtSize(nro, 7.4)) / 2,
    y: fromTop(211.2),
    size: 7.4,
    font: bold,
    color: black,
  });
  page.drawText(cam, {
    x: JERSEY_LEFT + (width - bold.widthOfTextAtSize(cam, 5.1)) / 2,
    y: fromTop(218.6),
    size: 5.1,
    font: bold,
    color: black,
  });
}

function sortPlayers<T extends RosterPdfPlayer>(players: T[]) {
  return [...players].sort((a, b) => {
    const aj = parseJerseyNumber(a.jerseyNumber) ?? 9999;
    const bj = parseJerseyNumber(b.jerseyNumber) ?? 9999;
    if (aj !== bj) return aj - bj;
    return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "es");
  });
}

export type NormalizedRosterPlayer = Omit<RosterPdfPlayer, "jerseyNumber"> & {
  jerseyNumber: number;
};

export function normalizeRosterPlayers(players: RosterPdfPlayer[]): NormalizedRosterPlayer[] {
  const missing: string[] = [];
  const normalized: NormalizedRosterPlayer[] = [];
  for (const player of players) {
    const firstName = String(player.firstName ?? "").trim();
    const lastName = String(player.lastName ?? "").trim();
    const jerseyNumber = parseJerseyNumber(player.jerseyNumber);
    const label = `${lastName || "sin apellido"}, ${firstName || "sin nombre"}`;
    if (!firstName || !lastName) {
      missing.push(label);
      continue;
    }
    if (jerseyNumber == null || jerseyNumber < 1 || jerseyNumber > 99) {
      missing.push(label);
      continue;
    }
    normalized.push({
      firstName,
      lastName,
      dni: player.dni,
      birthDate: player.birthDate,
      jerseyNumber,
    });
  }
  if (missing.length) {
    throw new Error(
      `Falta nombre o número de camiseta (1 a 99) en: ${missing.join("; ")}.`,
    );
  }
  return sortPlayers(normalized).slice(0, 14);
}

export async function buildBlankAccreditationPdf(): Promise<Uint8Array> {
  const template = await PDFDocument.load(Buffer.from(LISTA_BUENA_FE_TEMPLATE_PDF_BASE64, "base64"));
  const doc = await PDFDocument.create();
  const [page] = await doc.copyPages(template, [0]);
  doc.addPage(page);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  coverPrintedJerseys(page);
  drawJerseyHeader(page, bold);
  return doc.save();
}

export async function buildAccreditationPdf(input: RosterPdfInput): Promise<Uint8Array> {
  const template = await PDFDocument.load(Buffer.from(LISTA_BUENA_FE_TEMPLATE_PDF_BASE64, "base64"));
  const doc = await PDFDocument.create();
  const [page] = await doc.copyPages(template, [0]);
  doc.addPage(page);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [delegate1, delegate2] = pickDelegates(input.staff);

  const players = normalizeRosterPlayers(input.players);

  drawFilled(page, regular, input.clubName, FIELD_X.equipo, FIELD_Y.equipo, 240);
  drawFilled(page, regular, delegate1 ? describeStaff(delegate1) : "", FIELD_X.dt, FIELD_Y.dt1, 370);
  drawFilled(page, regular, delegate2 ? describeStaff(delegate2) : "", FIELD_X.dt, FIELD_Y.dt2, 370);
  drawCategoryField(page, regular, input.categoryLabel);
  coverPrintedJerseys(page);
  drawJerseyHeader(page, bold);
  const size = 10.5;
  const colW = JERSEY_RIGHT - JERSEY_LEFT;
  for (let i = 0; i < 14; i++) {
    const baseline = fromTop(rowTop(i) + ROW_TEXT_OFFSET);
    const player = players[i];
    if (!player) continue;

    const jersey = parseJerseyNumber(player.jerseyNumber);
    if (jersey != null) {
      const label = String(jersey);
      const jerseySize = jersey >= 100 ? 8 : 10.5;
      page.drawText(label, {
        x: JERSEY_LEFT + (colW - regular.widthOfTextAtSize(label, jerseySize)) / 2,
        y: baseline,
        size: jerseySize,
        font: regular,
        color: black,
      });
    }

    page.drawText(
      fitText(regular, `${player.lastName}, ${player.firstName}`, size, TABLE_COLUMNS[2] - 83.9 - 4),
      { x: 83.9, y: baseline, size, font: regular, color: black },
    );
    page.drawText(fitText(regular, player.dni, size, TABLE_COLUMNS[3] - 265.2 - 4), {
      x: 265.2,
      y: baseline,
      size,
      font: regular,
      color: black,
    });
    page.drawText(formatBirthDateDisplay(player.birthDate), {
      x: 372.3,
      y: baseline,
      size,
      font: regular,
      color: black,
    });
  }

  markCategoryYear(page, regular, input.categoryLabel, players.length);

  return doc.save();
}
