import { STAFF_ROLES, formatBirthDateDisplay, type StaffRole } from "@/lib/accreditation";

type RosterMailPlayer = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  jerseyNumber: number;
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

  if (!input.staff.length) {
    lines.push("(sin cuerpo técnico cargado)");
  } else {
    for (const member of input.staff) {
      const role = STAFF_ROLES.find((r) => r.value === member.role)?.label ?? member.role;
      lines.push(
        `- ${role}: ${member.firstName} ${member.lastName}` +
          (member.dni ? ` | DNI ${member.dni}` : "") +
          (member.phone ? ` | Tel ${member.phone}` : ""),
      );
    }
  }

  lines.push("", `=== JUGADORES (${input.players.length}) ===`);
  lines.push("# | Apellido y nombre | DNI | Nacimiento");

  const sorted = [...input.players].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  for (const player of sorted) {
    lines.push(
      `${String(player.jerseyNumber).padStart(2, "0")} | ${player.lastName}, ${player.firstName} | ${player.dni} | ${formatBirthDateDisplay(player.birthDate)}`,
    );
  }

  lines.push("", "— Fin del plantel —");
  return lines.join("\n");
}
