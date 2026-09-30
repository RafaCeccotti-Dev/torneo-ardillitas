/** Parsea texto OCR de un DNI argentino (frente). */

export type DniOcrFields = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string; // dd/mm/aaaa
};

function cleanLine(line: string) {
  return line
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9/\s.-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function lineAfterLabel(lines: string[], labels: RegExp[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!labels.some((re) => re.test(line))) continue;
    const rest = line
      .replace(/^(APELLIDO|SURNAME|NOMBRE|NAME|DOCUMENTO|DNI|FECHA(?:\s+DE)?\s+NACIMIENTO|DATE\s+OF\s+BIRTH)[:\s/|-]*/i, "")
      .trim();
    if (rest && !/^(APELLIDO|SURNAME|NOMBRE|NAME|DOCUMENTO)/i.test(rest)) return rest;
    const next = lines[i + 1];
    if (next && next.length >= 2) return next;
  }
  return null;
}

function extractDni(text: string, lines: string[]): string {
  const labeled = lineAfterLabel(lines, [
    /\bDOCUMENTO\b/,
    /\bDNI\b/,
    /\bNRO\b/,
    /\bN[°º.]?\b/,
  ]);
  if (labeled) {
    const digits = labeled.replace(/\D/g, "");
    if (digits.length >= 7 && digits.length <= 8) return digits;
  }

  // Prefer numbers that look like DNI (7–8) and aren't years
  const candidates = Array.from(text.matchAll(/\b(\d{1,2}[.\s]?\d{3}[.\s]?\d{3})\b/g)).map((m) =>
    m[1].replace(/\D/g, ""),
  );
  const eight = candidates.find((d) => d.length === 8);
  if (eight) return eight;
  const seven = candidates.find((d) => d.length === 7);
  if (seven) return seven;

  const loose = Array.from(text.matchAll(/\b(\d{7,8})\b/g)).map((m) => m[1]);
  return loose.find((d) => !/^19\d{2}|^20\d{2}/.test(d.slice(0, 4)) || d.length === 8) ?? "";
}

const MONTHS: Record<string, string> = {
  ENE: "01",
  JAN: "01",
  FEB: "02",
  MAR: "03",
  ABR: "04",
  APR: "04",
  MAY: "05",
  JUN: "06",
  JUL: "07",
  AGO: "08",
  AUG: "08",
  SEP: "09",
  SEPT: "09",
  OCT: "10",
  NOV: "11",
  DIC: "12",
  DEC: "12",
};

function extractBirthDate(text: string, lines: string[]): string {
  const labeled = lineAfterLabel(lines, [
    /FECHA.*NAC/,
    /DATE\s+OF\s+BIRTH/,
    /\bNACIMIENTO\b/,
  ]);
  const pool = [labeled, text].filter(Boolean).join(" ");

  const slash = pool.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (slash) {
    return `${slash[1].padStart(2, "0")}/${slash[2].padStart(2, "0")}/${slash[3]}`;
  }

  const named = pool.match(
    /\b(\d{1,2})\s*([A-Z]{3,4})\s*(?:\/\s*[A-Z]{3,4})?\s*(\d{4})\b/i,
  );
  if (named) {
    const month = MONTHS[named[2].toUpperCase().slice(0, 3)] ?? MONTHS[named[2].toUpperCase()];
    if (month) {
      return `${named[1].padStart(2, "0")}/${month}/${named[3]}`;
    }
  }

  return "";
}

function isNameLike(value: string) {
  if (!value || value.length < 2) return false;
  if (/\d/.test(value)) return false;
  if (
    /^(APELLIDO|SURNAME|NOMBRE|NAME|DOCUMENTO|NACIONAL|IDENTIDAD|REPUBLICA|ARGENTINA|FECHA|NACIMIENTO|SEXO|SEX|EJEMPLAR|DOMICILIO|TRAMITE)$/i.test(
      value,
    )
  ) {
    return false;
  }
  return /^[A-ZÁÉÍÓÚÑ ]+$/i.test(value);
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function parseArgentineDniOcr(rawText: string): Partial<DniOcrFields> {
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((l) => l.length > 0);

  const lastRaw = lineAfterLabel(lines, [/\bAPELLIDO\b/, /\bSURNAME\b/]);
  const firstRaw = lineAfterLabel(lines, [/\bNOMBRE\b/, /\bNAME\b/]);

  const lastName = lastRaw && isNameLike(lastRaw) ? toTitleCase(lastRaw) : "";
  const firstName = firstRaw && isNameLike(firstRaw) ? toTitleCase(firstRaw) : "";
  const dni = extractDni(rawText, lines);
  const birthDate = extractBirthDate(rawText, lines);

  return {
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(dni ? { dni } : {}),
    ...(birthDate ? { birthDate } : {}),
  };
}
