import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { combineKickoff } from "@/lib/kickoff";
import { revalidateTournamentPages, resolveMatchStatus } from "@/lib/revalidate-tournament";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const [{ data: matches, error: matchesError }, { data: teams, error: teamsError }] =
    await Promise.all([
      supabase
        .from("matches")
        .select(
          "id, category, year_label, phase, round_label, home_team_id, away_team_id, home_score, away_score, kickoff_at, court, status",
        )
        .order("kickoff_at", { ascending: true }),
      supabase.from("teams").select("id, name, group_name"),
    ]);

  if (matchesError) {
    return NextResponse.json({ error: matchesError.message }, { status: 500 });
  }
  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }

  const teamMap = new Map((teams ?? []).map((team) => [team.id, team]));

  const enriched = (matches ?? []).map((match) => ({
    ...match,
    home_team: teamMap.get(match.home_team_id) ?? null,
    away_team: teamMap.get(match.away_team_id) ?? null,
  }));

  return NextResponse.json({ matches: enriched });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const {
    category,
    yearLabel,
    phase,
    roundLabel,
    homeTeamId,
    awayTeamId,
    kickoffDate,
    kickoffTime,
    court,
    status = "programado",
    homeScore = null,
    awayScore = null,
  } = body;

  if (!category || !yearLabel || !phase || !homeTeamId || !awayTeamId || !kickoffDate || !kickoffTime || !court) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  if (homeTeamId === awayTeamId) {
    return NextResponse.json({ error: "Los equipos deben ser distintos" }, { status: 400 });
  }

  const resolvedStatus = resolveMatchStatus(status, homeScore, awayScore);

  const { data, error } = await supabase
    .from("matches")
    .insert({
      category,
      year_label: yearLabel,
      phase,
      round_label: roundLabel || null,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_score: homeScore,
      away_score: awayScore,
      kickoff_at: combineKickoff(kickoffDate, kickoffTime),
      court,
      status: resolvedStatus,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTournamentPages();

  return NextResponse.json({ ok: true, id: data.id });
}
