import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { combineKickoff } from "@/lib/kickoff";
import { revalidateTournamentPages, resolveMatchStatus } from "@/lib/revalidate-tournament";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  const { data: current, error: fetchError } = await supabase
    .from("matches")
    .select("home_score, away_score, status")
    .eq("id", params.id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  if (body.category) updates.category = body.category;
  if (body.yearLabel) updates.year_label = body.yearLabel;
  if (body.phase) updates.phase = body.phase;
  if ("roundLabel" in body) updates.round_label = body.roundLabel || null;
  if (body.homeTeamId) updates.home_team_id = body.homeTeamId;
  if (body.awayTeamId) updates.away_team_id = body.awayTeamId;
  if (body.court) updates.court = body.court;
  if ("homeScore" in body) updates.home_score = body.homeScore;
  if ("awayScore" in body) updates.away_score = body.awayScore;
  if ("kickoffDate" in body && "kickoffTime" in body && body.kickoffDate && body.kickoffTime) {
    updates.kickoff_at = combineKickoff(body.kickoffDate, body.kickoffTime);
  }

  const homeScore = "homeScore" in body ? body.homeScore : current.home_score;
  const awayScore = "awayScore" in body ? body.awayScore : current.away_score;
  const nextStatus = resolveMatchStatus(
    body.status ?? current.status,
    homeScore,
    awayScore,
  );
  updates.status = nextStatus;

  const { error } = await supabase.from("matches").update(updates).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTournamentPages();

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const { error } = await supabase.from("matches").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTournamentPages();

  return NextResponse.json({ ok: true });
}
