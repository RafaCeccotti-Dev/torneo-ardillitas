import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { formatBirthDateDisplay, type StaffRole } from "@/lib/accreditation";
import { BUENA_FE_BACKGROUND_JPG_BASE64 } from "@/lib/buena-fe-background";
import { siteConfig } from "@/config/site";

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

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 45.4;
const MIN_ROWS = 14;

const TABLE_COLUMNS = [45.4, 78.5, 259.8, 367, 474, 581];
const TABLE_TOP = 201.6;
const HEADER_HEIGHT = 27.5;
const ROW_HEIGHT = 27.2;

const DELEGATE_ROLE_ORDER: StaffRole[] = ["dt", "delegado", "ayudante", "otro", "medico"];

const black = rgb(0, 0, 0);
const yellow = rgb(1, 1, 0);
const gray = rgb(0.4, 0.4, 0.4);

/** Coordenada Y medida desde arriba de la hoja (como en el modelo) → coordenada pdf-lib. */
function fromTop(y: number) {
  return PAGE_HEIGHT - y;
}

function tournamentYear() {
  return siteConfig.tournamentDates.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear());
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

function drawLabel(
  page: PDFPage,
  fontBold: PDFFont,
  label: string,
  x: number,
  baselineTop: number,
) {
  const size = 12;
  page.drawText(label, { x, y: fromTop(baselineTop), size, font: fontBold, color: black });
  const width = fontBold.widthOfTextAtSize(label, size);
  page.drawLine({
    start: { x, y: fromTop(baselineTop + 2) },
    end: { x: x + width, y: fromTop(baselineTop + 2) },
    thickness: 0.7,
    color: black,
  });
  return x + width;
}

function drawField(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  label: string,
  value: string,
  baselineTop: number,
  maxX = PAGE_WIDTH - MARGIN_X,
) {
  const endOfLabel = drawLabel(page, fonts.bold, label, MARGIN_X, baselineTop);
  if (!value) return;
  const x = endOfLabel + 8;
  page.drawText(fitText(fonts.regular, value, 11, maxX - x), {
    x,
    y: fromTop(baselineTop),
    size: 11,
    font: fonts.regular,
    color: black,
  });
}

function drawTitleBox(page: PDFPage, fontBold: PDFFont, text: string, top: number) {
  const size = 16;
  const height = 19.4;
  const width = fontBold.widthOfTextAtSize(text, size) + 8;
  const x = (PAGE_WIDTH - width) / 2;
  page.drawRectangle({ x, y: fromTop(top + height), width, height, color: black });
  page.drawText(text, { x: x + 4, y: fromTop(top + 15), size, font: fontBold, color: yellow });
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

export async function buildAccreditationPdf(input: RosterPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const background = await doc.embedJpg(Buffer.from(BUENA_FE_BACKGROUND_JPG_BASE64, "base64"));
  const fonts = { regular, bold };
  const year = tournamentYear();

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawImage(background, { x: -182.35, y: fromTop(804.55), width: 960, height: 767.25 });

  drawTitleBox(page, bold, "LISTA DE BUENA FE", 48.8);
  drawTitleBox(page, bold, `TORNEO ARDILLITAS ${year}`, 68);

  drawField(page, fonts, "EQUIPO:", input.clubName, 108, 380);
  drawLabel(page, bold, "RESULTADOS PARTIDOS:", 386.8, 108);

  const [delegate1, delegate2] = pickDelegates(input.staff);
  drawField(page, fonts, "DELEGADO/DT 1:", delegate1 ? describeStaff(delegate1) : "", 131.5);
  drawField(page, fonts, "DELEGADO/DT 2:", delegate2 ? describeStaff(delegate2) : "", 158.5);
  drawField(page, fonts, "CATEGORÍA:", input.categoryLabel, 185.5);

  const players = [...input.players].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  const rowCount = Math.max(MIN_ROWS, players.length);
  const tableBottom = TABLE_TOP + HEADER_HEIGHT + rowCount * ROW_HEIGHT;
  const left = TABLE_COLUMNS[0];
  const right = TABLE_COLUMNS[TABLE_COLUMNS.length - 1];
  const line = { thickness: 0.5, color: black };

  for (const x of TABLE_COLUMNS) {
    page.drawLine({ start: { x, y: fromTop(TABLE_TOP) }, end: { x, y: fromTop(tableBottom) }, ...line });
  }
  page.drawLine({ start: { x: left, y: fromTop(TABLE_TOP) }, end: { x: right, y: fromTop(TABLE_TOP) }, ...line });
  for (let i = 0; i <= rowCount; i++) {
    const y = fromTop(TABLE_TOP + HEADER_HEIGHT + i * ROW_HEIGHT);
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, ...line });
  }

  const headerSize = 11;
  const headerBaseline = TABLE_TOP + 11.5;
  page.drawText("APELLIDO Y NOMBRE", { x: 83.9, y: fromTop(headerBaseline), size: headerSize, font: bold, color: black });
  page.drawText("DNI", { x: 265.2, y: fromTop(headerBaseline), size: headerSize, font: bold, color: black });
  page.drawText("FECHA", { x: 372.3, y: fromTop(headerBaseline), size: headerSize, font: bold, color: black });
  page.drawText("NACIMIENTO", { x: 372.3, y: fromTop(headerBaseline + 12.5), size: headerSize, font: bold, color: black });
  page.drawText("FIRMA", { x: 479.4, y: fromTop(headerBaseline), size: headerSize, font: bold, color: black });

  for (let i = 0; i < rowCount; i++) {
    const baseline = fromTop(TABLE_TOP + HEADER_HEIGHT + i * ROW_HEIGHT + 17.5);
    page.drawText(`${i + 1}.`, { x: 51, y: baseline, size: 13, font: bold, color: black });

    const player = players[i];
    if (!player) continue;
    const size = 10.5;
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

  const footer = [
    "Esta lista de buena fe fue completada y firmada por los delegados responsables del equipo participante.",
    "A su vez fue controlada por la gente de coordinación del torneo.",
    `De esta manera se acepta todo el reglamento pautado para la realización del Torneo Ardillitas ${year} y`,
    "cualquier decisión que tome la coordinación del mismo.",
  ];
  let footerTop = tableBottom + 13;
  for (const text of footer) {
    page.drawText(text, { x: MARGIN_X, y: fromTop(footerTop), size: 10.5, font: regular, color: black });
    footerTop += 16.6;
  }
  page.drawText("Firma Delegado 1 ..............................", {
    x: MARGIN_X,
    y: fromTop(footerTop),
    size: 11,
    font: bold,
    color: black,
  });
  page.drawText("Firma Delegado 2 ..............................", {
    x: 330,
    y: fromTop(footerTop),
    size: 11,
    font: bold,
    color: black,
  });

  const sentAt = new Date()
    .toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
    .replace(/\s/g, " ");
  page.drawText(toWinAnsi(regular, `Enviada desde la acreditación online el ${sentAt}`), {
    x: MARGIN_X,
    y: 24,
    size: 8,
    font: regular,
    color: gray,
  });

  return doc.save();
}
