import {
  formatBirthDateDisplay,
  MAX_STAFF_PER_CATEGORY,
  staffKindLabel,
  type StaffRole,
} from "@/lib/accreditation";

type RosterMailPlayer = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  jerseyNumber: number | null;
};

type RosterMailStaff = {
  role: StaffRole;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
};

export function buildRosterEmailText(input: {
  clubName: string;
  categoryLabel: string;
  players: RosterMailPlayer[];
  staff: RosterMailStaff[];
}) {
  const lines: string[] = [
    "INSCRIPCIÓN DE PLANTEL — Torneo Ardillitas",
    "",
    `Club: ${input.clubName}`,
    `Categoría: ${input.categoryLabel}`,
    `Fecha: ${new Date().toLocaleString("es-AR")}`,
    "",
    "=== CUERPO TÉCNICO ===",
  ];

  const staff = input.staff.slice(0, MAX_STAFF_PER_CATEGORY);
  if (!staff.length) {
    lines.push("(sin cuerpo técnico cargado)");
  } else {
    for (const member of staff) {
      const role = staffKindLabel(member.role);
      lines.push(
        `- ${role}: ${member.firstName} ${member.lastName}` +
          (member.dni ? ` | DNI ${member.dni}` : "") +
          (member.phone ? ` | Tel ${member.phone}` : ""),
      );
    }
  }

  lines.push("", `=== JUGADORES (${input.players.length}) ===`);
  lines.push("# | Apellido y nombre | DNI | Nacimiento");

  const sorted = [...input.players].sort(
    (a, b) => (Number(a.jerseyNumber) || 9999) - (Number(b.jerseyNumber) || 9999),
  );
  for (const player of sorted) {
    lines.push(
      `${String(player.jerseyNumber).padStart(2, "0")} | ${player.lastName}, ${player.firstName} | ${player.dni} | ${formatBirthDateDisplay(player.birthDate)}`,
    );
  }

  lines.push("", "— Fin del plantel —");
  return lines.join("\n");
}
