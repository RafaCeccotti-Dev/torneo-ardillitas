import { NextResponse } from "next/server";

import { randomToken } from "@/lib/accreditation";
import { requireAdmin } from "@/lib/admin-auth";

function publicLogoUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  logoPath: string | null | undefined,
) {
  if (!logoPath) return null;
  return supabase.storage.from("escudos").getPublicUrl(logoPath).data.publicUrl as string;
}

/** Todas las inscripciones (categoría/año/grupo) de un club por nombre exacto. */
async function teamsForClub(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  clubName: string,
) {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, category, year_label, group_name, logo_path")
    .eq("name", clubName)
    .order("category", { ascending: true })
    .order("year_label", { ascending: true })
    .order("group_name", { ascending: true });

  if (error) return { teams: [], error };
  return { teams: data ?? [], error: null };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const { data: portals, error } = await supabase
    .from("accreditation_portals")
    .select("id, token, name, logo_path, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error: error.message.includes("accreditation_portals")
          ? "Falta ejecutar supabase/accreditation.sql en Supabase."
          : error.message,
      },
      { status: 500 },
    );
  }

  const { data: allTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, category, year_label, group_name, logo_path")
    .order("name", { ascending: true });

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }

  const clubsMap = new Map<
    string,
    { name: string; inscriptions: number; categories: string[] }
  >();
  for (const team of allTeams ?? []) {
    const current = clubsMap.get(team.name) ?? {
      name: team.name as string,
      inscriptions: 0,
      categories: [] as string[],
    };
    current.inscriptions += 1;
    const label = `${team.year_label}${team.category === "femenino" ? " Fem" : ""}${team.group_name ? ` · G${team.group_name}` : ""}`;
    if (!current.categories.includes(label)) current.categories.push(label);
    clubsMap.set(team.name as string, current);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin = siteUrl || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const portalsWithTeams = await Promise.all(
    (portals ?? []).map(async (portal) => {
      const { teams } = await teamsForClub(supabase, portal.name);
      return {
        id: portal.id,
        token: portal.token,
        name: portal.name,
        logoUrl: publicLogoUrl(
          supabase,
          portal.logo_path || teams.find((t: { logo_path: string | null }) => t.logo_path)?.logo_path,
        ),
        createdAt: portal.created_at,
        teams: teams.map(
          (team: {
            id: string;
            name: string;
            category: string;
            year_label: string;
            group_name: string;
          }) => ({
            id: team.id,
            name: team.name,
            category: team.category,
            yearLabel: team.year_label,
            groupName: team.group_name,
          }),
        ),
        url: origin ? `${origin}/acreditar/${portal.token}` : `/acreditar/${portal.token}`,
      };
    }),
  );

  return NextResponse.json({
    portals: portalsWithTeams,
    clubs: Array.from(clubsMap.values()).sort((a, b) => a.name.localeCompare(b.name, "es")),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const name = String(body.name ?? body.clubName ?? "").trim();

  if (name.length < 2) {
    return NextResponse.json({ error: "Elegí un club" }, { status: 400 });
  }

  const { teams, error: teamsError } = await teamsForClub(supabase, name);
  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 });
  }
  if (!teams.length) {
    return NextResponse.json(
      { error: "Ese club no tiene categorías inscriptas todavía" },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("accreditation_portals")
    .select("id, token")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: "Ya existe un link para ese club. Copiá el que está en la lista.",
        portal: { id: existing.id, token: existing.token, name, url: `/acreditar/${existing.token}` },
      },
      { status: 409 },
    );
  }

  const token = randomToken();
  const logoPath =
    teams.find((t: { logo_path: string | null }) => t.logo_path)?.logo_path ?? null;

  const { data: portal, error } = await supabase
    .from("accreditation_portals")
    .insert({ token, name, logo_path: logoPath })
    .select("id, token, name")
    .single();

  if (error || !portal) {
    return NextResponse.json(
      {
        error: error?.message.includes("accreditation_portals")
          ? "Falta ejecutar supabase/accreditation.sql en Supabase."
          : error?.message ?? "No se pudo crear el link",
      },
      { status: 500 },
    );
  }

  // Snapshot opcional (el panel del DT resuelve por nombre de club en vivo)
  await supabase.from("accreditation_portal_teams").insert(
    teams.map((team: { id: string }) => ({ portal_id: portal.id, team_id: team.id })),
  );

  return NextResponse.json({
    ok: true,
    portal: {
      id: portal.id,
      token: portal.token,
      name: portal.name,
      url: `/acreditar/${portal.token}`,
      categories: teams.length,
    },
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await supabase.from("accreditation_portals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
