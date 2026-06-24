import type { StandingRow } from "@/lib/types";
import type { TournamentCategorySlug } from "@/lib/tournament-categories";

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

/** año → grupo → filas */
export type StandingsByYear = Record<string, Record<string, StandingRow[]>>;

export const mockStandingsByCategory: Record<TournamentCategorySlug, StandingsByYear> = {
  masculino: {
    "2015": {
      A: [
        {
          team: team("m15-a1", "Ardillitas FC", "A"),
          played: 2,
          won: 2,
          drawn: 0,
          lost: 0,
          goalsFor: 5,
          goalsAgainst: 2,
          points: 6,
        },
        {
          team: team("m15-a2", "Sportivo Norte", "A"),
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 4,
          goalsAgainst: 3,
          points: 3,
        },
        emptyRow("Juventud Unida", "A", "m15-a3"),
      ],
      B: [
        emptyRow("Defensores Sur", "B", "m15-b1"),
        emptyRow("Atlético Ceres", "B", "m15-b2"),
      ],
      C: [emptyRow("Por confirmar", "C", "m15-c1")],
    },
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
