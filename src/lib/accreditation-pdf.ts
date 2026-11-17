import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { formatBirthDateDisplay, type StaffRole } from "@/lib/accreditation";
import { LISTA_BUENA_FE_TEMPLATE_PDF_BASE64 } from "@/lib/lista-buena-fe-template";

export type RosterPdfPlayer = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  jerseyNumber: number;
};

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

const TABLE_COLUMNS = [45.4, 78.5, 259.8, 367, 474, 581];
const TABLE_TOP = 201.6;
const HEADER_HEIGHT = 27.5;
const ROW_HEIGHT = 23.7;
const ROW_TEXT_OFFSET = 13;

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

const YEAR_CHIPS: Record<string, { x: number; width: number }> = {
  "2015": { x: 42, width: 92 },
  "2016": { x: 136, width: 88 },
  "2017": { x: 238, width: 100 },
  "2018": { x: 342, width: 98 },
  "2019": { x: 444, width: 92 },
};

const DELEGATE_ROLE_ORDER: StaffRole[] = ["dt", "delegado", "ayudante", "otro", "medico"];

const black = rgb(0, 0, 0);
const yellow = rgb(1, 0.85, 0);

function fromTop(y: number) {
  return PAGE_HEIGHT - y;
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
    .slice(0, 2);
}

function markCategoryYear(page: PDFPage, categoryLabel: string) {
  const year = categoryLabel.match(/\b(201[5-9])\b/)?.[1];
  if (!year) return;
  const chip = YEAR_CHIPS[year];
  if (!chip) return;
  page.drawRectangle({
    x: chip.x,
    y: fromTop(176),
    width: chip.width,
    height: 18,
    borderColor: black,
    borderWidth: 1.2,
    color: yellow,
    opacity: 0.28,
    borderOpacity: 1,
  });
}

function loadTemplateBytes() {
  return Buffer.from(LISTA_BUENA_FE_TEMPLATE_PDF_BASE64, "base64");
}

export async function buildAccreditationPdf(input: RosterPdfInput): Promise<Uint8Array> {
  const template = await PDFDocument.load(loadTemplateBytes());
  const doc = await PDFDocument.create();
  const [page] = await doc.copyPages(template, [0]);
  doc.addPage(page);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const [delegate1, delegate2] = pickDelegates(input.staff);

  drawFilled(page, regular, input.clubName, FIELD_X.equipo, FIELD_Y.equipo, 240);
  drawFilled(page, regular, delegate1 ? describeStaff(delegate1) : "", FIELD_X.dt, FIELD_Y.dt1, 370);
  drawFilled(page, regular, delegate2 ? describeStaff(delegate2) : "", FIELD_X.dt, FIELD_Y.dt2, 370);
  drawFilled(page, regular, input.categoryLabel, FIELD_X.categoria, FIELD_Y.categoria, 175);
  markCategoryYear(page, input.categoryLabel);

  const players = [...input.players].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  const size = 10.5;
  for (let i = 0; i < Math.min(players.length, 14); i++) {
    const player = players[i];
    const baseline = fromTop(TABLE_TOP + HEADER_HEIGHT + i * ROW_HEIGHT + ROW_TEXT_OFFSET);
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

  return doc.save();
}
