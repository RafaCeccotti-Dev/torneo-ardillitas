import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidateTournamentPages } from "@/lib/revalidate-tournament";

const TOKEN = "ardillitas-seed-2016-demo";
const YEAR = "2016";

function authorize(request: Request) {
  const url = new URL(request.url);
  const header = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const token = url.searchParams.get("token")?.trim() || header;
  if (token !== TOKEN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

/** Preview o limpieza: saca grupos ficticios 2016 y borra partidos de esa categoría. No borra equipos. */
export async function GET(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

  const supabase = createServiceClient();
  const shouldClear = new URL(request.url).searchParams.get("clear") === "1";

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, category, year_label, group_name")
    .eq("year_label", YEAR)
    .order("name");

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }

  const { count: matchCount, error: matchCountError } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("year_label", YEAR);

  if (matchCountError) {
    return NextResponse.json({ error: matchCountError.message }, { status: 500 });
  }

  const previewTeams = (teams ?? []).map((team) => ({
    name: team.name,
    category: team.category,
    group: team.group_name || null,
  }));

  if (!shouldClear) {
    return NextResponse.json({
      ok: true,
      preview: true,
      year: YEAR,
      teams: previewTeams,
      teamsCount: previewTeams.length,
      matchesCount: matchCount ?? 0,
      hint: "Agregá &clear=1 para vaciar grupos 2016 y borrar partidos de esa categoría. No borra equipos.",
    });
  }

  const { data: deletedMatches, error: deleteMatchesError } = await supabase
    .from("matches")
    .delete()
    .eq("year_label", YEAR)
    .select("id");

  if (deleteMatchesError) {
    return NextResponse.json({ error: deleteMatchesError.message }, { status: 500 });
  }

  const { data: updatedTeams, error: clearGroupsError } = await supabase
    .from("teams")
    .update({ group_name: "" })
    .eq("year_label", YEAR)
    .select("id, name, category, group_name");

  if (clearGroupsError) {
    return NextResponse.json({ error: clearGroupsError.message }, { status: 500 });
  }

  revalidateTournamentPages();

  return NextResponse.json({
    ok: true,
    cleared: true,
    year: YEAR,
    teamsKept: (updatedTeams ?? []).map((team) => ({
      name: team.name,
      category: team.category,
      group: team.group_name || null,
    })),
    teamsCount: updatedTeams?.length ?? 0,
    matchesDeleted: deletedMatches?.length ?? 0,
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "El armado ficticio de grupos 2016 está deshabilitado. El coordinador asigna grupos desde el admin." },
    { status: 410 },
  );
}
