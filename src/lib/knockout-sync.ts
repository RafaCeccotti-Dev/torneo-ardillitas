import { combineKickoff } from "@/lib/kickoff";
import {
  cupOf,
  groupsComplete,
  isPlaceholderTeam,
  knockoutRound,
  matchLoser,
  matchWinner,
  pairBestVsWorst,
  rankTeams,
  resolveSlot,
  type RankedTeam,
} from "@/lib/knockout";
import { splitRoundAndPens } from "@/lib/penalties";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";
import type { Match, Team } from "@/lib/types";

type DbTeam = {
  id: string;
  name: string;
  slug: string;
  category: string;
  year_label: string;
  group_name: string;
};

type DbMatch = {
  id: string;
  category: string;
  year_label: string;
  phase: "grupos" | "cruces";
  round_label: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string;
  court: string;
  status: "programado" | "en_juego" | "finalizado";
};

function asTeam(row: DbTeam): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    group: row.group_name,
    category: row.category as Team["category"],
    yearLabel: row.year_label,
  };
}

function asMatch(row: DbMatch, teams: Map<string, Team>): Match | null {
  const homeTeam = teams.get(row.home_team_id);
  const awayTeam = teams.get(row.away_team_id);
  if (!homeTeam || !awayTeam) return null;
  const parsed = splitRoundAndPens(row.round_label);
  return {
    id: row.id,
    phase: row.phase,
    roundLabel: parsed.roundLabel,
    category: homeTeam.category ?? "masculino",
    yearLabel: row.year_label,
    homeTeam,
    awayTeam,
    homeScore: row.home_score,
    awayScore: row.away_score,
    homePenalties: parsed.homePenalties,
    awayPenalties: parsed.awayPenalties,
    kickoffAt: row.kickoff_at,
    court: row.court,
    status: row.status,
  };
}

function isDeferredSlot(name: string) {
  const key = name.trim().toLowerCase();
  if (/ganador/.test(key)) return true;
  if (/perdedor/.test(key)) return true;
  if (/4[°º]\s*peor/.test(key)) return true;
  if (/^2[°º]\s*mejor$/.test(key)) return true;
  if (/^3[°º]\s*peor$/.test(key)) return true;
  return false;
}

function canRewrite(match: Match) {
  return match.status !== "finalizado" && match.homeScore == null && match.awayScore == null;
}

function seedOf(ranked: RankedTeam[], teamId: string) {
  return ranked.find((row) => row.team.id === teamId) ?? null;
}

function uniqueRanked(teams: Team[], ranked: RankedTeam[]) {
  return teams
    .map((team) => seedOf(ranked, team.id))
    .filter((row): row is RankedTeam => Boolean(row))
    .filter((row, index, list) => list.findIndex((item) => item.team.id === row.team.id) === index);
}

function cupMatches(matches: Match[], cup: "oro" | "plata" | "femenino") {
  return matches.filter((match) => match.phase === "cruces" && cupOf(match.roundLabel) === cup);
}

function roundMatches(matches: Match[], round: "cuartos" | "semis" | "final") {
  return [...matches]
    .filter((match) => knockoutRound(match.roundLabel) === round)
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
}

function winnersOf(matches: Match[]) {
  if (!matches.length) return null;
  const winners: Team[] = [];
  for (const match of matches) {
    const winner = matchWinner(match);
    if (!winner || isPlaceholderTeam(winner)) return null;
    winners.push(winner);
  }
  return winners;
}

function defaultsFor(cup: "oro" | "plata", round: "semis" | "final", index: number) {
  if (cup === "oro" && round === "semis") {
    return index === 0
      ? { time: "12:00", court: "Cancha 1" }
      : { time: "12:40", court: "Cancha 2" };
  }
  if (cup === "oro" && round === "final") {
    return { time: "17:00", court: "Cancha 1" };
  }
  if (cup === "plata" && round === "semis") {
    return index === 0
      ? { time: "18:00", court: "Cancha 1" }
      : { time: "18:40", court: "Cancha 2" };
  }
  return { time: "19:20", court: "Cancha 1" };
}

function pairLabel(cup: "oro" | "plata", round: "semis" | "final", index: number, total: number) {
  const cupName = cup === "oro" ? "Copa de Oro" : "Copa de Plata";
  if (round === "final") return `${cupName} · Final`;
  if (total === 1) return `${cupName} · Semifinal`;
  if (index === 0) return `${cupName} · Semifinal · Mejor restante vs Peor restante`;
  return `${cupName} · Semifinal · 2° mejor vs 3° mejor`;
}

export async function syncKnockouts(category: string, yearLabel: string) {
  if (!hasServiceRole()) return { ok: false, reason: "service" };

  const supabase = createServiceClient();
  const [{ data: teamRows, error: teamsError }, { data: matchRows, error: matchesError }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, slug, category, year_label, group_name")
        .eq("category", category)
        .eq("year_label", yearLabel),
      supabase
        .from("matches")
        .select(
          "id, category, year_label, phase, round_label, home_team_id, away_team_id, home_score, away_score, kickoff_at, court, status",
        )
        .eq("category", category)
        .eq("year_label", yearLabel),
    ]);

  if (teamsError || matchesError || !teamRows?.length) {
    return { ok: false, reason: teamsError?.message || matchesError?.message || "empty" };
  }

  const teamMap = new Map((teamRows as DbTeam[]).map((row) => [row.id, asTeam(row)]));
  const matches = (matchRows as DbMatch[])
    .map((row) => asMatch(row, teamMap))
    .filter((match): match is Match => match !== null);
  const groupMatches = matches.filter((match) => match.phase === "grupos");
  const cruces = matches.filter((match) => match.phase === "cruces");
  const ranked = rankTeams(Array.from(teamMap.values()), groupMatches);

  const actions: string[] = [];

  async function updateTeams(matchId: string, homeId: string, awayId: string, label?: string) {
    const patch: Record<string, unknown> = {
      home_team_id: homeId,
      away_team_id: awayId,
    };
    if (label) patch.round_label = label;
    const { error } = await supabase.from("matches").update(patch).eq("id", matchId);
    if (error) throw new Error(error.message);
  }

  async function insertMatch(input: {
    label: string;
    homeId: string;
    awayId: string;
    time: string;
    court: string;
  }) {
    const { error } = await supabase.from("matches").insert({
      category,
      year_label: yearLabel,
      phase: "cruces",
      round_label: input.label,
      home_team_id: input.homeId,
      away_team_id: input.awayId,
      home_score: null,
      away_score: null,
      kickoff_at: combineKickoff("2026-11-23", input.time),
      court: input.court,
      status: "programado",
    });
    if (error) throw new Error(error.message);
  }

  async function writePairs(
    cup: "oro" | "plata",
    round: "semis" | "final",
    alive: RankedTeam[],
  ) {
    const pairs = pairBestVsWorst(alive);
    if (!pairs.length) return;
    const existing = roundMatches(cupMatches(cruces, cup), round);
    for (let index = 0; index < pairs.length; index += 1) {
      const [best, worst] = pairs[index];
      const label = pairLabel(cup, round, index, pairs.length);
      const current = existing[index];
      if (current) {
        if (!canRewrite(current)) continue;
        await updateTeams(current.id, best.team.id, worst.team.id, current.roundLabel || label);
        actions.push(`update ${label}`);
      } else {
        const slot = defaultsFor(cup, round, index);
        await insertMatch({
          label,
          homeId: best.team.id,
          awayId: worst.team.id,
          time: slot.time,
          court: slot.court,
        });
        actions.push(`insert ${label}`);
      }
    }
  }

  if (groupsComplete(groupMatches)) {
    for (const match of cruces) {
      if (!canRewrite(match)) continue;
      const homeName = match.homeTeam.name;
      const awayName = match.awayTeam.name;
      const homeNeeds = isPlaceholderTeam(match.homeTeam) && !isDeferredSlot(homeName);
      const awayNeeds = isPlaceholderTeam(match.awayTeam) && !isDeferredSlot(awayName);
      if (!homeNeeds && !awayNeeds) continue;
      const home = homeNeeds ? resolveSlot(homeName, ranked) : match.homeTeam;
      const away = awayNeeds ? resolveSlot(awayName, ranked) : match.awayTeam;
      if (!home || !away || home.id === away.id) continue;
      await updateTeams(match.id, home.id, away.id);
      actions.push(`fill ${match.roundLabel}`);
    }
  }

  const oroFirst =
    roundMatches(cupMatches(cruces, "oro"), "cuartos").length > 0
      ? roundMatches(cupMatches(cruces, "oro"), "cuartos")
      : roundMatches(cupMatches(cruces, "oro"), "semis");

  if (category !== "femenino" && oroFirst.length) {
    const oroLosers = oroFirst
      .map((match) => matchLoser(match))
      .filter((team): team is Team => {
        if (!team) return false;
        return !isPlaceholderTeam(team);
      });
    if (oroLosers.length === oroFirst.length && winnersOf(oroFirst)) {
      const bestLoser = uniqueRanked(oroLosers, ranked).sort((a, b) => a.seed - b.seed)[0];
      if (bestLoser) {
        for (const match of cupMatches(cruces, "plata")) {
          if (!canRewrite(match)) continue;
          const homePerdedor = /perdedor/i.test(match.homeTeam.name);
          const awayPerdedor = /perdedor/i.test(match.awayTeam.name);
          if (!homePerdedor && !awayPerdedor) continue;
          await updateTeams(
            match.id,
            homePerdedor ? bestLoser.team.id : match.homeTeam.id,
            awayPerdedor ? bestLoser.team.id : match.awayTeam.id,
          );
          actions.push("fill mejor perdedor oro");
        }
      }
    }
  }

  async function advanceCup(cup: "oro" | "plata") {
    const all = cupMatches(cruces, cup);
    const cuartos = roundMatches(all, "cuartos");
    const semis = roundMatches(all, "semis");

    if (cuartos.length) {
      const cuartosWinners = winnersOf(cuartos);
      if (cuartosWinners) {
        let aliveTeams = cuartosWinners;
        if (cup === "plata" && yearLabel === "2019/2020") {
          const nine = ranked.find((row) => row.generalRank === 9)?.team;
          const ten = ranked.find((row) => row.generalRank === 10)?.team;
          if (nine) aliveTeams = [...aliveTeams, nine];
          if (ten) aliveTeams = [...aliveTeams, ten];
        }
        const alive = uniqueRanked(aliveTeams, ranked);
        if (alive.length >= 4) await writePairs(cup, "semis", alive);
        else if (alive.length === 2) await writePairs(cup, "final", alive);
      }
    } else if (semis.length) {
      const semiWinners = winnersOf(semis);
      if (semiWinners?.length === 2) {
        await writePairs(cup, "final", uniqueRanked(semiWinners, ranked));
      }
      return;
    }

    const semiNow = roundMatches(cupMatches(cruces, cup), "semis");
    const semiWinners = winnersOf(semiNow);
    if (semiWinners?.length === 2) {
      await writePairs(cup, "final", uniqueRanked(semiWinners, ranked));
    }
  }

  async function fillFinalFromSemis(cup: "oro" | "plata") {
    const semis = roundMatches(cupMatches(cruces, cup), "semis");
    const winners = winnersOf(semis);
    const finals = roundMatches(cupMatches(cruces, cup), "final");
    if (winners?.length === 2 && finals[0] && canRewrite(finals[0])) {
      await updateTeams(finals[0].id, winners[0].id, winners[1].id);
      actions.push(`fill final femenino ${cup}`);
    }
  }

  async function advanceFemale() {
    if (yearLabel === "2013") return;

    if (yearLabel === "2011") {
      const oroSemis = roundMatches(cupMatches(cruces, "oro"), "semis");
      const plataSemis = roundMatches(cupMatches(cruces, "plata"), "semis");

      for (let index = 0; index < oroSemis.length; index += 1) {
        const loser = matchLoser(oroSemis[index]);
        if (!loser || isPlaceholderTeam(loser)) continue;
        const needle = new RegExp(`perdedor\\s*sf\\s*oro\\s*${index + 1}`, "i");
        const target = plataSemis.find(
          (match) =>
            needle.test(match.roundLabel ?? "") ||
            needle.test(match.homeTeam.name) ||
            needle.test(match.awayTeam.name),
        );
        if (!target || !canRewrite(target)) continue;
        const homePerdedor = /perdedor/i.test(target.homeTeam.name);
        const awayPerdedor = /perdedor/i.test(target.awayTeam.name);
        if (!homePerdedor && !awayPerdedor) continue;
        await updateTeams(
          target.id,
          homePerdedor ? loser.id : target.homeTeam.id,
          awayPerdedor ? loser.id : target.awayTeam.id,
        );
        actions.push(`fill perdedor oro ${index + 1}`);
      }

      await fillFinalFromSemis("oro");
      await fillFinalFromSemis("plata");
    }
  }

  try {
    if (category === "femenino") {
      await advanceFemale();
    } else {
      await advanceCup("oro");
      await advanceCup("plata");
    }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "sync" };
  }

  return { ok: true, actions };
}
