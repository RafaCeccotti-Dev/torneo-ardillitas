import { NextResponse } from "next/server";

import {
  normalizeTeamKey,
  officialFixtures,
  type OfficialYearFixture,
} from "@/data/official-fixtures-2015-2017";
import { isProductionLocked, productionLockedResponse } from "@/lib/production-lock";
import { revalidateTournamentPages } from "@/lib/revalidate-tournament";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEED_TOKEN = "ardillitas-seed-official-2015-2017";
const CATEGORY = "masculino";
const YEARS = ["2015", "2016", "2017"] as const;

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  group_name: string;
  sort_order: number;
  year_label: string;
};

function authorize(request: Request) {
  const header = request.headers.get("x-seed-token");
  const query = new URL(request.url).searchParams.get("token");
  return header === SEED_TOKEN || query === SEED_TOKEN;
}

function kickoffIso(day: "sabado" | "domingo" | "lunes", time: string) {
  const date =
    day === "sabado" ? "2026-11-21" : day === "domingo" ? "2026-11-22" : "2026-11-23";
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

function slugify(value: string) {
  return normalizeTeamKey(value)
    .replace(/"/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function resolveDbName(fixture: OfficialYearFixture, rawName: string, dbNames: Set<string>) {
  const key = normalizeTeamKey(rawName);
  const aliased = fixture.aliases[key];
  if (aliased && dbNames.has(aliased)) return aliased;
  if (dbNames.has(rawName)) return rawName;
  for (const name of Array.from(dbNames)) {
    if (normalizeTeamKey(name) === key) return name;
  }
  return null;
}

async function upsertPlaceholder(
  supabase: ReturnType<typeof createServiceClient>,
  yearLabel: string,
  slotName: string,
  sortOrder: number,
): Promise<TeamRow> {
  const slug = `pend-${yearLabel}-${slugify(slotName)}`;
  const { data: existing } = await supabase
    .from("teams")
    .select("id, name, slug, group_name, sort_order, year_label")
    .eq("category", CATEGORY)
    .eq("year_label", yearLabel)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("teams")
      .update({ name: slotName, group_name: "PEND", sort_order: sortOrder })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return { ...existing, name: slotName, group_name: "PEND", sort_order: sortOrder };
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: slotName,
      slug,
      category: CATEGORY,
      year_label: yearLabel,
      group_name: "PEND",
      sort_order: sortOrder,
    })
    .select("id, name, slug, group_name, sort_order, year_label")
    .single();

  if (error || !data) throw new Error(error?.message || `No se pudo crear placeholder ${slotName}`);
  return data as TeamRow;
}

export async function POST(request: Request) {
  if (isProductionLocked()) return productionLockedResponse();
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
  const summary: Record<string, unknown> = {};

  try {
    for (const fixture of officialFixtures) {
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, slug, group_name, sort_order, year_label")
        .eq("category", CATEGORY)
        .eq("year_label", fixture.yearLabel)
        .neq("group_name", "PEND");

      if (teamsError) throw new Error(teamsError.message);
      if (!teams?.length) {
        throw new Error(`No hay equipos cargados para masculino ${fixture.yearLabel}`);
      }

      const teamRows = teams as TeamRow[];
      const byName = new Map(teamRows.map((t) => [t.name, t]));
      const dbNames = new Set(teamRows.map((t) => t.name));

      // Asignar grupos
      const expectedNames = Object.values(fixture.groups).flat();
      for (const expected of expectedNames) {
        if (!byName.has(expected)) {
          throw new Error(
            `${fixture.yearLabel}: falta el equipo "${expected}" en la base. Equipos: ${teamRows.map((t) => t.name).join(" | ")}`,
          );
        }
      }

      let sort = 1;
      for (const [groupName, names] of Object.entries(fixture.groups)) {
        for (const name of names) {
          const team = byName.get(name)!;
          const { error } = await supabase
            .from("teams")
            .update({ group_name: groupName, sort_order: sort })
            .eq("id", team.id);
          if (error) throw new Error(error.message);
          team.group_name = groupName;
          team.sort_order = sort;
          sort += 1;
        }
      }

      // Borrar partidos previos de la categoría/año (incluye cruces viejos)
      const { error: delError, count: deleted } = await supabase
        .from("matches")
        .delete({ count: "exact" })
        .eq("category", CATEGORY)
        .eq("year_label", fixture.yearLabel);
      if (delError) throw new Error(delError.message);

      const groupInserts: Record<string, unknown>[] = [];
      const unresolved: string[] = [];

      for (const match of fixture.groupMatches) {
        const homeName = resolveDbName(fixture, match.home, dbNames);
        const awayName = resolveDbName(fixture, match.away, dbNames);
        if (!homeName || !awayName) {
          unresolved.push(`${match.home} vs ${match.away}`);
          continue;
        }
        const home = byName.get(homeName)!;
        const away = byName.get(awayName)!;
        groupInserts.push({
          category: CATEGORY,
          year_label: fixture.yearLabel,
          phase: "grupos",
          round_label: `Grupo ${match.group}`,
          home_team_id: home.id,
          away_team_id: away.id,
          home_score: null,
          away_score: null,
          kickoff_at: kickoffIso(match.day, match.time),
          court: `Cancha ${match.court}`,
          status: "programado",
        });
      }

      if (unresolved.length) {
        throw new Error(
          `${fixture.yearLabel}: no se pudieron mapear partidos: ${unresolved.join(" || ")}`,
        );
      }

      const { data: insertedGroupRows, error: insGroupError } = await supabase
        .from("matches")
        .insert(groupInserts)
        .select("id");
      if (insGroupError) throw new Error(insGroupError.message);
      const insertedGroups = insertedGroupRows?.length ?? 0;

      // Placeholders + cruces
      const slotNames = Array.from(
        new Set(
          [...fixture.oro, ...fixture.plata].flatMap((m) => [m.homeSlot, m.awaySlot]),
        ),
      );
      const slotMap = new Map<string, TeamRow>();
      let slotSort = 900;
      for (const slot of slotNames) {
        slotMap.set(slot, await upsertPlaceholder(supabase, fixture.yearLabel, slot, slotSort));
        slotSort += 1;
      }

      const crucesInserts = [...fixture.oro, ...fixture.plata].map((match) => ({
        category: CATEGORY,
        year_label: fixture.yearLabel,
        phase: "cruces" as const,
        round_label: match.roundLabel,
        home_team_id: slotMap.get(match.homeSlot)!.id,
        away_team_id: slotMap.get(match.awaySlot)!.id,
        home_score: null,
        away_score: null,
        kickoff_at: kickoffIso("lunes", match.time),
        court: `Cancha ${match.court}`,
        status: "programado" as const,
      }));

      const { data: insertedCrucesRows, error: insCrucesError } = await supabase
        .from("matches")
        .insert(crucesInserts)
        .select("id");
      if (insCrucesError) throw new Error(insCrucesError.message);
      const insertedCruces = insertedCrucesRows?.length ?? 0;

      summary[fixture.yearLabel] = {
        teamsGrouped: expectedNames.length,
        groups: Object.keys(fixture.groups),
        deletedMatches: deleted ?? 0,
        groupMatches: insertedGroups ?? groupInserts.length,
        cruces: insertedCruces ?? crucesInserts.length,
        placeholders: slotNames.length,
      };
    }

    revalidateTournamentPages();

    return NextResponse.json({
      ok: true,
      years: YEARS,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al seedear fixtures" },
      { status: 500 },
    );
  }
}
