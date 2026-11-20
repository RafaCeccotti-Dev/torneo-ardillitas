import { parseJerseyNumber, type RosterPdfPlayer } from "@/lib/accreditation-pdf";

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chipYear(categoryLabel: string) {
  if (/2019\s*\/\s*2020/.test(categoryLabel)) return "2019";
  return categoryLabel.match(/\b(201[5-9])\b/)?.[1] ?? null;
}

export async function readAccreditationPdfText(pdfBytes: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(pdfBytes);
  const pdf = await pdfjs.getDocument({ data, verbosity: 0 }).promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  return (content.items as Array<{ str?: string }>)
    .map((item) => item.str ?? "")
    .filter(Boolean)
    .join(" | ");
}

export async function assertAccreditationPdf(
  pdfBytes: Uint8Array,
  input: {
    clubName: string;
    categoryLabel: string;
    players: RosterPdfPlayer[];
  },
) {
  const text = fold(await readAccreditationPdfText(pdfBytes));
  const club = fold(input.clubName).replace(/"/g, "");
  if (club && !text.replace(/"/g, "").includes(club)) {
    throw new Error("El PDF no tiene el nombre del club");
  }
  if (!text.includes(fold(input.categoryLabel))) {
    throw new Error("El PDF no tiene la categoría y el grupo");
  }

  const year = chipYear(input.categoryLabel);
  if (!year) throw new Error("El PDF no tiene el año de la categoría");
  const count = input.players.length;
  const chip = count === 1 ? `${year} (1 Jugador)` : `${year} (${count} Jugadores)`;
  if (!text.includes(fold(chip))) {
    throw new Error(`El PDF no marca ${chip}`);
  }

  for (const player of input.players) {
    const name = fold(`${player.lastName}, ${player.firstName}`);
    if (!text.includes(name)) {
      throw new Error(`El PDF no tiene a ${player.lastName}, ${player.firstName}`);
    }
    const jersey = parseJerseyNumber(player.jerseyNumber);
    if (jersey == null || !text.includes(`| ${jersey} |`)) {
      throw new Error(`El PDF no tiene el nº ${jersey ?? "?"} de ${player.lastName}`);
    }
  }
}
