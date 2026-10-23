import { NextResponse } from "next/server";

import { revalidateTournamentPages } from "@/lib/revalidate-tournament";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Token one-shot para la prueba de fixture 2016. Borrar este endpoint después. */
const SEED_TOKEN = "ardillitas-seed-2016-demo";

const CATEGORY = "masculino";
const YEAR = "2016";
const GROUPS = ["A", "B", "C", "D"] as const;

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  group_name: string;
  sort_order: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundRobinPairs<T>(teams: T[]): [T, T][] {
  const pairs: [T, T][] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push([teams[i], teams[j]]);
    }
  }
  return pairs;
}

function randomScore() {
  const home = Math.floor(Math.random() * 6);
  let away = Math.floor(Math.random() * 6);
  if (Math.random() > 0.25 && home === away) {
    away = (away + 1 + Math.floor(Math.random() * 2)) % 6;
  }
  return { home, away };
}

function kickoffIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

function computeStandings(
  teams: TeamRow[],
  matches: { home_team_id: string; away_team_id: string; home_score: number; away_score: number }[],
) {
  const rows = new Map(
    teams.map((t) => [
      t.id,
      { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 },
    ]),
  );

  for (const m of matches) {
    const home = rows.get(m.home_team_id);
    const away = rows.get(m.away_team_id);
    if (!home || !away) continue;
    home.played += 1;
    away.played += 1;
    home.gf += m.home_score;
    home.ga += m.away_score;
    away.gf += m.away_score;
    away.ga += m.home_score;
    if (m.home_score > m.away_score) {
      home.won += 1;
      home.pts += 3;
      away.lost += 1;
    } else if (m.home_score < m.away_score) {
      away.won += 1;
      away.pts += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }

  return Array.from(rows.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const da = a.gf - a.ga;
    const db = b.gf - b.ga;
    if (db !== da) return db - da;
    return b.gf - a.gf;
  });
}

function authorize(request: Request) {
  const header = request.headers.get("x-seed-token");
  const url = new URL(request.url);
  const query = url.searchParams.get("token");
  return header === SEED_TOKEN || query === SEED_TOKEN;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel" },
      { status: 503 },
    );
  }

  const supabase = createServiceClient();

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, slug, group_name, sort_order")
    .eq("category", CATEGORY)
    .eq("year_label", YEAR)
    .order("name", { ascending: true });

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }
  if (!teams?.length) {
    return NextResponse.json(
      { error: "No hay equipos en masculino 2016" },
      { status: 400 },
    );
  }

  const { error: delError, count: deletedCount } = await supabase
    .from("matches")
    .delete({ count: "exact" })
    .eq("category", CATEGORY)
    .eq("year_label", YEAR);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  const pool = shuffle(teams as TeamRow[]);
  const byGroup: Record<(typeof GROUPS)[number], TeamRow[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };

  if (pool.length >= 16) {
    byGroup.A = pool.slice(0, 4);
    byGroup.B = pool.slice(4, 8);
    byGroup.C = pool.slice(8, 12);
    byGroup.D = pool.slice(12, 16);
  } else {
    pool.forEach((team, i) => {
      byGroup[GROUPS[i % 4]].push(team);
    });
  }

  for (const g of GROUPS) {
    for (let i = 0; i < byGroup[g].length; i++) {
      const team = byGroup[g][i];
      const { error } = await supabase
        .from("teams")
        .update({
          group_name: g,
          sort_order: GROUPS.indexOf(g) * 10 + i + 1,
        })
        .eq("id", team.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      team.group_name = g;
    }
  }

  const groupDates = ["2026-11-21", "2026-11-22", "2026-11-22"];
  const groupTimes = ["09:00", "10:30", "12:00", "15:00", "16:30", "18:00"];
  const courts = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];

  const groupMatchesToInsert: Record<string, unknown>[] = [];
  let timeIdx = 0;

  for (const g of GROUPS) {
    const pairs = roundRobinPairs(byGroup[g]);
    pairs.forEach((pair, idx) => {
      const date = groupDates[Math.floor(idx / 2) % groupDates.length];
      const time = groupTimes[timeIdx % groupTimes.length];
      const court = courts[timeIdx % courts.length];
      timeIdx += 1;
      const { home, away } = randomScore();
      const [homeTeam, awayTeam] = Math.random() > 0.5 ? pair : [pair[1], pair[0]];
      groupMatchesToInsert.push({
        category: CATEGORY,
        year_label: YEAR,
        phase: "grupos",
        round_label: `Grupo ${g} · Jornada ${Math.floor(idx / 2) + 1}`,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        home_score: home,
        away_score: away,
        kickoff_at: kickoffIso(date, time),
        court,
        status: "finalizado",
      });
    });
  }

  const { data: insertedGroups, error: insGroupError } = await supabase
    .from("matches")
    .insert(groupMatchesToInsert)
    .select("id, home_team_id, away_team_id, home_score, away_score");

  if (insGroupError) {
    return NextResponse.json({ error: insGroupError.message }, { status: 500 });
  }

  const tops: Record<string, { first: TeamRow; second: TeamRow }> = {};
  const standingsSummary: Record<string, { name: string; pts: number; gf: number; ga: number }[]> =
    {};

  for (const g of GROUPS) {
    const teamIds = new Set(byGroup[g].map((t) => t.id));
    const groupMatchRows = (insertedGroups ?? []).filter(
      (m) =>
        teamIds.has(m.home_team_id) &&
        teamIds.has(m.away_team_id) &&
        m.home_score != null &&
        m.away_score != null,
    ) as {
      home_team_id: string;
      away_team_id: string;
      home_score: number;
      away_score: number;
    }[];
    const standings = computeStandings(byGroup[g], groupMatchRows);
    tops[g] = { first: standings[0].team, second: standings[1].team };
    standingsSummary[g] = standings.map((row) => ({
      name: row.team.name,
      pts: row.pts,
      gf: row.gf,
      ga: row.ga,
    }));
  }

  const qfDate = "2026-11-23";
  const quarterFinals = [
    {
      label: "Cuartos · 1°A vs 2°B",
      home: tops.A.first,
      away: tops.B.second,
      time: "09:00",
      court: "Cancha 1",
    },
    {
      label: "Cuartos · 1°B vs 2°A",
      home: tops.B.first,
      away: tops.A.second,
      time: "10:30",
      court: "Cancha 2",
    },
    {
      label: "Cuartos · 1°C vs 2°D",
      home: tops.C.first,
      away: tops.D.second,
      time: "12:00",
      court: "Cancha 3",
    },
    {
      label: "Cuartos · 1°D vs 2°C",
      home: tops.D.first,
      away: tops.C.second,
      time: "15:00",
      court: "Cancha 4",
    },
  ];

  const qfRows = quarterFinals.map((qf) => ({
    category: CATEGORY,
    year_label: YEAR,
    phase: "cruces",
    round_label: qf.label,
    home_team_id: qf.home.id,
    away_team_id: qf.away.id,
    home_score: null,
    away_score: null,
    kickoff_at: kickoffIso(qfDate, qf.time),
    court: qf.court,
    status: "programado",
  }));

  const { error: qfError } = await supabase.from("matches").insert(qfRows);
  if (qfError) {
    return NextResponse.json({ error: qfError.message }, { status: 500 });
  }

  revalidateTournamentPages();

  return NextResponse.json({
    ok: true,
    teams: teams.length,
    deletedMatches: deletedCount ?? 0,
    groupMatches: insertedGroups?.length ?? 0,
    quarterFinals: quarterFinals.map((qf) => ({
      label: qf.label,
      home: qf.home.name,
      away: qf.away.name,
      kickoff: `${qfDate} ${qf.time}`,
      court: qf.court,
    })),
    groups: Object.fromEntries(
      GROUPS.map((g) => [g, byGroup[g].map((t) => t.name)]),
    ),
    standings: standingsSummary,
  });
}
