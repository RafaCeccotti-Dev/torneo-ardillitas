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
    "2011": {
      A: [emptyRow("Por confirmar", "A", "f11-a1")],
      B: [emptyRow("Por confirmar", "B", "f11-b1")],
      C: [emptyRow("Por confirmar", "C", "f11-c1")],
    },
    "2014": {
      A: [emptyRow("Por confirmar", "A", "f14-a1")],
      B: [emptyRow("Por confirmar", "B", "f14-b1")],
      C: [emptyRow("Por confirmar", "C", "f14-c1")],
    },
    "2016": {
      A: [emptyRow("Por confirmar", "A", "f16-a1")],
      B: [emptyRow("Por confirmar", "B", "f16-b1")],
      C: [emptyRow("Por confirmar", "C", "f16-c1")],
    },
  },
};
