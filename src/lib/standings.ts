import type { Match, StandingRow, Team } from "@/lib/types";

export function isGeneralTable(group: string) {
  return group.trim().toUpperCase() === "PEND";
}

export function groupHeading(group: string) {
  return isGeneralTable(group) ? "Tabla general" : `Grupo ${group}`;
}

export function sortGroupNames(groups: string[]) {
  return [...groups].sort((a, b) => {
    if (isGeneralTable(a) !== isGeneralTable(b)) return isGeneralTable(a) ? 1 : -1;
    return a.localeCompare(b);
  });
}

export function sortStandingRows(rows: StandingRow[]) {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.goalsFor - a.goalsAgainst;
    const diffB = b.goalsFor - b.goalsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name, "es");
  });
}

export function computeGeneralStandings(groups: Record<string, StandingRow[]>) {
  return sortStandingRows(
    Object.entries(groups)
      .filter(([group]) => !isGeneralTable(group))
      .flatMap(([, rows]) => rows),
  );
}

export const crucesQualificationNotes: Record<string, string> = {
  "2015":
    "3 grupos. Copa de Oro: 1° y 2° de cada grupo más los dos mejores 3° (8 equipos: cuartos, semis y final). Copa de Plata: el 3° que queda y los tres 4° (4 equipos: semis y final).",
  "2016":
    "Copa de Oro: 1° y 2° de cada grupo más los dos mejores 3°. Copa de Plata: el 3° que queda, 4° y 5°.",
  "2017": "Copa de Oro: 1° y 2° de cada grupo. Copa de Plata: 3° y 4° de cada grupo.",
  "2018":
    "Copa de Oro: 1° y 2° de cada grupo más los dos mejores 3°. Copa de Plata: el 3° que queda y los 4°.",
  "2019/2020":
    "Copa de Oro: del 1° al 8° de esta tabla. Copa de Plata: 11° vs 14° y 12° vs 13° (9° y 10° van a semis).",
  "femenino:2013":
    "Clasificación por esta tabla. Final de Oro: 1° vs 2°. Final de Plata: 3° vs 4°. El 5° queda eliminado.",
  "femenino:2011":
    "Clasificación por tabla general. Semis de Oro: 1° vs 4° y 2° vs 3°. Semis de Plata: 5° vs perdedor semi Oro 1, 6° vs perdedor semi Oro 2. Finales: ganador vs ganador.",
};

export function computeStandingsByGroup(teams: Team[], matches: Match[]) {
  const groups: Record<string, Map<string, StandingRow>> = {};
  const teamById = new Map(teams.map((team) => [team.id, team]));

  for (const team of teams) {
    if (!groups[team.group]) groups[team.group] = new Map();
    groups[team.group].set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    if (match.status !== "finalizado") continue;
    if (match.homeScore == null || match.awayScore == null) continue;

    const homeTeam = teamById.get(match.homeTeam.id);
    const awayTeam = teamById.get(match.awayTeam.id);
    if (!homeTeam || !awayTeam) continue;

    const home = groups[homeTeam.group]?.get(homeTeam.id);
    const away = groups[awayTeam.group]?.get(awayTeam.id);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const result: Record<string, StandingRow[]> = {};
  for (const [group, rows] of Object.entries(groups)) {
    result[group] = sortStandingRows(Array.from(rows.values()));
  }

  return result;
}
