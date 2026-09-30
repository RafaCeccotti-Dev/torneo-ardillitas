export const MAX_PLAYERS_PER_CATEGORY = 16;

export const STAFF_ROLES = [
  { value: "dt", label: "Director técnico" },
  { value: "ayudante", label: "Ayudante de campo" },
  { value: "delegado", label: "Delegado" },
  { value: "medico", label: "Médico / kinesiólogo" },
  { value: "otro", label: "Otro" },
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number]["value"];

export type AccreditationTeam = {
  id: string;
  name: string;
  category: string;
  yearLabel: string;
  groupName: string;
  logoUrl: string | null;
  playerCount: number;
};

export type AccreditationPlayer = {
  id: string;
  teamId: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  jerseyNumber: number;
  dniPhotoUrl: string | null;
};

export type AccreditationStaff = {
  id: string;
  teamId: string;
  role: StaffRole;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
};

export function normalizeDni(value: string) {
  return value.replace(/\D/g, "");
}

export function parseBirthDate(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  return `${year}-${month}-${day}`;
}

export function formatBirthDateDisplay(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
