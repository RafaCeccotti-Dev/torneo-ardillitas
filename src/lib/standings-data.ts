import type { StandingRow } from "@/lib/types";
import type { TournamentCategorySlug } from "@/lib/tournament-categories";
import { seedTeams } from "@/lib/teams-seed";

function team(id: string, name: string, group: string): StandingRow["team"] {
  return {
    id,
    name,
    slug: id,
    group,
    logoUrl: null,
  };
}

function emptyRow(teamName: string, group: string, id: string): StandingRow {
  const t = team(id, teamName, group);
  return {
    team: t,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

function seedRowsForYear(yearLabel: string): Record<string, StandingRow[]> {
  const groups: Record<string, StandingRow[]> = {};
  for (const seed of seedTeams.filter((item) => item.yearLabel === yearLabel)) {
    if (!groups[seed.group]) groups[seed.group] = [];
    groups[seed.group].push(emptyRow(seed.name, seed.group, seed.slug));
  }
  return groups;
}

/** año → grupo → filas */
export type StandingsByYear = Record<string, Record<string, StandingRow[]>>;

const masculino2015 = seedRowsForYear("2015");

export const mockStandingsByCategory: Record<TournamentCategorySlug, StandingsByYear> = {
  masculino: {
    "2015": masculino2015,
    "2016": {
      A: [emptyRow("Por confirmar", "A", "m16-a1")],
      B: [emptyRow("Por confirmar", "B", "m16-b1")],
      C: [emptyRow("Por confirmar", "C", "m16-c1")],
    },
    "2017": {
      A: [emptyRow("Por confirmar", "A", "m17-a1")],
      B: [emptyRow("Por confirmar", "B", "m17-b1")],
      C: [emptyRow("Por confirmar", "C", "m17-c1")],
    },
    "2018": {
      A: [emptyRow("Por confirmar", "A", "m18-a1")],
      B: [emptyRow("Por confirmar", "B", "m18-b1")],
      C: [emptyRow("Por confirmar", "C", "m18-c1")],
    },
    "2019/2020": {
      A: [emptyRow("Por confirmar", "A", "m19-a1")],
      B: [emptyRow("Por confirmar", "B", "m19-b1")],
      C: [emptyRow("Por confirmar", "C", "m19-c1")],
    },
  },
  femenino: {
    "2013": {
      A: [
        emptyRow("Central Argentino Olímpico", "A", "f13-a1"),
        emptyRow("Colonia Alpina", "A", "f13-a2"),
        emptyRow("Warmis Unidas", "A", "f13-a3"),
        emptyRow("Las Pumas", "A", "f13-a4"),
        emptyRow("Esc. Raul Toloza", "A", "f13-a5"),
      ],
    },
    "2011": {
      A: [
        emptyRow("Central Argentino Olímpico", "A", "f11-a1"),
        emptyRow("Las Pumas", "A", "f11-a2"),
        emptyRow("Talleres", "A", "f11-a3"),
      ],
      B: [
        emptyRow("Warmis Unidas", "B", "f11-b1"),
        emptyRow("R. Sayana", "B", "f11-b2"),
        emptyRow("Atletico Selva", "B", "f11-b3"),
      ],
    },
  },
};
