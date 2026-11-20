import { NextResponse } from "next/server";

import { isProductionLocked, productionLockedResponse } from "@/lib/production-lock";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidateTournamentPages } from "@/lib/revalidate-tournament";

const TOKEN = "ardillitas-seed-2016-demo";
const TZ = "America/Argentina/Buenos_Aires";

function authorize(request: Request) {
  const url = new URL(request.url);
  const header = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const token = url.searchParams.get("token")?.trim() || header;
  if (token !== TOKEN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

function artClock(iso: string) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return { day, time };
}

/** Pasa 12:00 (12pm) a 00:00 (12am) hora Argentina. GET preview; &apply=1 escribe. */
export async function GET(request: Request) {
  if (isProductionLocked()) return productionLockedResponse();
  const denied = authorize(request);
  if (denied) return denied;

  const supabase = createServiceClient();
  const apply = new URL(request.url).searchParams.get("apply") === "1";

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, category, year_label, phase, court, kickoff_at")
    .order("kickoff_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const noon = (matches ?? []).filter((match) => artClock(match.kickoff_at).time === "12:00");
  const times: Record<string, number> = {};
  for (const match of matches ?? []) {
    const { time } = artClock(match.kickoff_at);
    times[time] = (times[time] ?? 0) + 1;
  }

  const preview = noon.map((match) => ({
    id: match.id,
    category: match.category,
    year: match.year_label,
    court: match.court,
    fromArt: artClock(match.kickoff_at),
    toArt: `${artClock(match.kickoff_at).day} 00:00`,
  }));

  if (!apply) {
    return NextResponse.json({
      ok: true,
      preview: true,
      total: matches?.length ?? 0,
      times,
      noonCount: noon.length,
      matches: preview,
      hint: "Agregá &apply=1 para pasar esos 12:00 a 00:00 (12am).",
    });
  }

  const updated = [];
  for (const match of noon) {
    const { day } = artClock(match.kickoff_at);
    const nextIso = new Date(`${day}T00:00:00-03:00`).toISOString();
    const { error: updateError } = await supabase
      .from("matches")
      .update({ kickoff_at: nextIso })
      .eq("id", match.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message, updated }, { status: 500 });
    }
    updated.push({ id: match.id, kickoff_at: nextIso, art: `${day} 00:00` });
  }

  revalidateTournamentPages();

  return NextResponse.json({
    ok: true,
    applied: true,
    updated: updated.length,
    matches: updated,
  });
}
