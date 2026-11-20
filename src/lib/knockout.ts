import type { Match, Team } from "@/lib/types";
import { computeGeneralStandings, computeStandingsByGroup } from "@/lib/standings";

export function isPlaceholderTeamName(name: string) {
  const value = name.trim();
  return (
    /pend-/i.test(value) ||
    /^(ganador|mejor|peor|perdedor|3° restante)\b/i.test(value) ||
    /^\d+°(\s|$)/.test(value) ||
    /^\d+°\s+grupo\b/i.test(value) ||
    /grupo\s+[a-d]$/i.test(value)
  );
}

/** Texto corto para el círculo: "1° Grupo A" → "1A". El nombre completo se lee abajo. */
export function placeholderBadge(name: string) {
  const key = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  const group = key.match(/^(\d+)[°o]\s+grupo\s+([a-d])$/i);
  if (group) return `${group[1]}${group[2].toUpperCase()}`;
  const general = key.match(/^(\d+)[°o]$/);
  if (general) return `${general[1]}°`;
  const mejorNth = key.match(/^(\d+)[°o]\s+mejor\s+(\d+)/i);
  if (mejorNth) return `${mejorNth[1]}M${mejorNth[2]}`;
  const mejor = key.match(/^mejor\s+(\d+)/i);
  if (mejor) return `M${mejor[1]}`;
  const peor = key.match(/^peor\s+(\d+)/i);
  if (peor) return `P${peor[1]}`;
  if (/3[°o]\s+restante/i.test(key) || /^peor\s+3/i.test(key)) return "3R";
  const nthGanador = key.match(/^(\d+)[°o]\s+mejor\s+ganador/i);
  if (nthGanador) return `${nthGanador[1]}G`;
  if (/mejor ganador/i.test(key)) return "MG";
  if (/peor ganador/i.test(key)) return "PG";
  const ganadorQf = key.match(/ganador\s*qf(?:\s+oro|\s+plata)?\s*(\d)/i);
  if (ganadorQf) return `Q${ganadorQf[1]}`;
  const ganador = key.match(/ganador\s*sf(?:\s+oro|\s+plata)?\s*(\d)/i);
  if (ganador) return `G${ganador[1]}`;
  const perdedor = key.match(/perdedor\s*sf(?:\s+oro|\s+plata)?\s*(\d)/i);
  if (perdedor) return `P${perdedor[1]}`;
  if (/perdedor/i.test(key)) return "MP";
  return name.replace(/grupo\s+/i, "").slice(0, 3).toUpperCase();
}

export function isPlaceholderTeam(team: Pick<Team, "name" | "group" | "slug">) {
  return (
    team.group?.toUpperCase() === "PEND" ||
    team.slug.startsWith("pend-") ||
    isPlaceholderTeamName(team.name)
  );
}

export type RankedTeam = {
  team: Team;
  groupPos: number;
  generalRank: number;
  seed: number;
  points: number;
  goalDiff: number;
  goalsFor: number;
};

export function rankTeams(teams: Team[], groupMatches: Match[]): RankedTeam[] {
  const realTeams = teams.filter((team) => !isPlaceholderTeam(team));
  const byGroup = computeStandingsByGroup(realTeams, groupMatches);
  const general = computeGeneralStandings(byGroup);
  const generalRank = new Map(general.map((row, index) => [row.team.id, index + 1]));

  const ranked: RankedTeam[] = [];
  for (const rows of Object.values(byGroup)) {
    rows.forEach((row, index) => {
      ranked.push({
        team: row.team,
        groupPos: index + 1,
        generalRank: generalRank.get(row.team.id) ?? 99,
        seed: 0,
        points: row.points,
        goalDiff: row.goalsFor - row.goalsAgainst,
        goalsFor: row.goalsFor,
      });
    });
  }

  ranked.sort((a, b) => {
    if (a.groupPos !== b.groupPos) return a.groupPos - b.groupPos;
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.generalRank - b.generalRank;
  });

  ranked.forEach((row, index) => {
    row.seed = index + 1;
  });

  return ranked;
}

function ofPos(ranked: RankedTeam[], pos: number) {
  return ranked.filter((row) => row.groupPos === pos);
}

export function resolveSlot(slot: string, ranked: RankedTeam[]): Team | null {
  const raw = slot.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const key = raw.toLowerCase().replace(/"/g, "");

  const groupPos = key.match(/^(\d+)[°o]\s+grupo\s+([a-d])$/i);
  if (groupPos) {
    const pos = Number(groupPos[1]);
    const group = groupPos[2].toUpperCase();
    return (
      ranked.find((row) => row.groupPos === pos && row.team.group.toUpperCase() === group)?.team ??
      null
    );
  }

  const general = key.match(/^(\d+)[°o]$/);
  if (general) {
    const n = Number(general[1]);
    return ranked.find((row) => row.generalRank === n)?.team ?? null;
  }

  const mejor = key.match(/^(?:(\d+)[°o]\s+)?mejor\s+(\d+)[°o]$/);
  if (mejor) {
    const nth = mejor[1] ? Number(mejor[1]) : 1;
    const pos = Number(mejor[2]);
    return ofPos(ranked, pos)[nth - 1]?.team ?? null;
  }

  const peor = key.match(/^peor\s+(\d+)[°o]$/);
  if (peor) {
    const list = ofPos(ranked, Number(peor[1]));
    return list[list.length - 1]?.team ?? null;
  }

  if (/^3[°o]\s+restante$/.test(key) || /^peor\s+3[°o]$/.test(key)) {
    const thirds = ofPos(ranked, 3);
    return thirds[thirds.length - 1]?.team ?? null;
  }

  const peorNth = key.match(/^(\d+)[°o]\s+peor\s+(\d+)[°o]$/);
  if (peorNth) {
    const nth = Number(peorNth[1]);
    const list = ofPos(ranked, Number(peorNth[2]));
    return list[list.length - nth]?.team ?? null;
  }

  return null;
}

export function matchWinner(match: {
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenalties?: number | null;
  awayPenalties?: number | null;
  status: string;
}): Team | null {
  if (match.status !== "finalizado") return null;
  if (match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore !== match.awayScore) {
    return match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
  }
  if (match.homePenalties == null || match.awayPenalties == null) return null;
  if (match.homePenalties === match.awayPenalties) return null;
  return match.homePenalties > match.awayPenalties ? match.homeTeam : match.awayTeam;
}

export function matchLoser(match: {
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
}): Team | null {
  const winner = matchWinner(match);
  if (!winner) return null;
  return winner.id === match.homeTeam.id ? match.awayTeam : match.homeTeam;
}

/** Entre los que siguen vivos, el mejor clasificado juega contra el peor. */
export function pairBestVsWorst(teams: RankedTeam[]): Array<[RankedTeam, RankedTeam]> {
  const ordered = [...teams].sort((a, b) => a.seed - b.seed);
  const pairs: Array<[RankedTeam, RankedTeam]> = [];
  let i = 0;
  let j = ordered.length - 1;
  while (i < j) {
    pairs.push([ordered[i], ordered[j]]);
    i += 1;
    j -= 1;
  }
  return pairs;
}

export function groupsComplete(groupMatches: Match[]) {
  return (
    groupMatches.length > 0 &&
    groupMatches.every(
      (match) =>
        match.status === "finalizado" && match.homeScore != null && match.awayScore != null,
    )
  );
}

export function cupOf(label: string | null | undefined): "oro" | "plata" | "femenino" {
  const value = (label ?? "").toLowerCase();
  if (value.includes("plata")) return "plata";
  if (value.includes("oro")) return "oro";
  return "femenino";
}

export function knockoutRound(label: string | null | undefined): "cuartos" | "semis" | "final" | "otro" {
  const value = (label ?? "").toLowerCase();
  if (/final/.test(value) && !/semifinal|semi/.test(value) && !/cuartos/.test(value)) return "final";
  if (/semifinal|semis/.test(value)) return "semis";
  if (/cuarto/.test(value)) return "cuartos";
  return "otro";
}

