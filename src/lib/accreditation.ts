/** Tope por categoría/equipo: no es obligatorio completar el máximo. */
export const MAX_PLAYERS_PER_CATEGORY = 14;
/** Delegados / cuerpo técnico por categoría: 0, 1 o 2 (ninguno obligatorio). */
export const MAX_STAFF_PER_CATEGORY = 2;
export const MAX_PROFES_PER_TEAM = 2;
export const MAX_DELEGADOS_PER_TEAM = 2;
/** Fotos destacadas en la web; el resto va por Drive. */
export const MAX_GALLERY_PHOTOS = 5;

export const STAFF_ROLES = [
  { value: "dt", label: "Director técnico / profe" },
  { value: "ayudante", label: "Ayudante de campo" },
  { value: "delegado", label: "Delegado" },
  { value: "medico", label: "Médico / kinesiólogo" },
  { value: "otro", label: "Delegado" },
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number]["value"];

export const STAFF_KINDS = [
  { value: "profe", label: "Profe / DT", max: MAX_PROFES_PER_TEAM },
  { value: "delegado", label: "Delegado", max: MAX_DELEGADOS_PER_TEAM },
  { value: "medico", label: "Médico / kinesiólogo", max: 1 },
] as const;

export type StaffKind = (typeof STAFF_KINDS)[number]["value"];

const STAFF_SLOTS: Record<StaffKind, StaffRole[]> = {
  profe: ["dt", "ayudante"],
  delegado: ["delegado", "otro"],
  medico: ["medico"],
};

export function kindOfRole(role: StaffRole): StaffKind {
  if (role === "dt" || role === "ayudante") return "profe";
  if (role === "delegado" || role === "otro") return "delegado";
  return "medico";
}

export function staffKindLabel(role: StaffRole) {
  return STAFF_KINDS.find((item) => item.value === kindOfRole(role))?.label ?? role;
}

export function countStaffKind(kind: StaffKind, staff: { role: StaffRole }[]) {
  return staff.filter((row) => kindOfRole(row.role) === kind).length;
}

export function nextStaffRole(kind: StaffKind, staff: { role: StaffRole }[]): StaffRole | null {
  const used = new Set(staff.map((row) => row.role));
  return STAFF_SLOTS[kind].find((role) => !used.has(role)) ?? null;
}

export type AccreditationTeam = {
  id: string;
  name: string;
  category: string;
  yearLabel: string;
  groupName: string;
  logoUrl: string | null;
  playerCount: number;
  sentAt: string | null;
};

export function categoryLabel(team: {
  yearLabel?: string;
  year_label?: string;
  category: string;
  groupName?: string;
  group_name?: string;
}) {
  const year = team.yearLabel ?? team.year_label ?? "";
  const gender = team.category === "femenino" ? "Femenino" : "Masculino";
  const group = team.groupName ?? team.group_name;
  return `${year} · ${gender}${group ? ` · Grupo ${group}` : ""}`;
}

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
