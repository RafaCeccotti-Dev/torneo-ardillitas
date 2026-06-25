import type { Match, StandingRow, Team } from "@/lib/types";

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
    result[group] = Array.from(rows.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.goalsFor - a.goalsAgainst;
      const diffB = b.goalsFor - b.goalsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.goalsFor - a.goalsFor;
    });
  }

  return result;
}
