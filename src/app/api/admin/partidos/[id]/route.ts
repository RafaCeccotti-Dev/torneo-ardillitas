import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";

type RouteContext = { params: { id: string } };

function combineKickoff(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.category) updates.category = body.category;
  if (body.yearLabel) updates.year_label = body.yearLabel;
  if (body.phase) updates.phase = body.phase;
  if ("roundLabel" in body) updates.round_label = body.roundLabel || null;
  if (body.homeTeamId) updates.home_team_id = body.homeTeamId;
  if (body.awayTeamId) updates.away_team_id = body.awayTeamId;
  if (body.court) updates.court = body.court;
  if (body.status) updates.status = body.status;
  if ("homeScore" in body) updates.home_score = body.homeScore;
  if ("awayScore" in body) updates.away_score = body.awayScore;
  if (body.kickoffDate && body.kickoffTime) {
    updates.kickoff_at = combineKickoff(body.kickoffDate, body.kickoffTime);
  }

  const { error } = await supabase.from("matches").update(updates).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  return NextResponse.json({ ok: true });
}
