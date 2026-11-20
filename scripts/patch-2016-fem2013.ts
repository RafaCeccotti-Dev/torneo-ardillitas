import { createClient } from "@supabase/supabase-js";

const FEMENINO_2013 = [
  "Colonia Alpina",
  "Central Argentino Olímpico",
  "Warmis Unidas",
  "Barrio Silencio",
] as const;

function normalizeTeamKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”"']/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function compactName(value: string) {
  return normalizeTeamKey(value)
    .replace(/\bde\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalizeTeamKey(value)
    .replace(/"/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function nameMatches(name: string, candidates: string[]) {
  const key = compactName(name);
  return candidates.some((candidate) => {
    const wanted = compactName(candidate);
    return key === wanted || key.includes(wanted) || wanted.includes(key);
  });
}

function pairMatches(home: string, away: string, a: string[], b: string[]) {
  return (
    (nameMatches(home, a) && nameMatches(away, b)) ||
    (nameMatches(home, b) && nameMatches(away, a))
  );
}

function kickoffIso(day: "sabado" | "domingo", time: string) {
  const date = day === "sabado" ? "2026-11-21" : "2026-11-22";
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^['"]|['"]$/g, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^['"]|['"]$/g, "");
  if (!url || !key) {
    throw new Error("faltan env de supabase");
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("supabase url invalida");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: teams2016, error: t16Err } = await supabase
    .from("teams")
    .select("id, name")
    .eq("year_label", "2016")
    .eq("category", "masculino");
  if (t16Err) throw new Error(t16Err.message);

  const teamById = new Map((teams2016 ?? []).map((row) => [row.id, row.name]));
  const { data: matches2016, error: m16Err } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, kickoff_at, court")
    .eq("year_label", "2016")
    .eq("category", "masculino")
    .eq("phase", "grupos");
  if (m16Err) throw new Error(m16Err.message);

  const desired2016 = [
    {
      key: "central-sl",
      homeHints: ["central ceres", "ccao"],
      awayHints: ["sl tostado", "sl de tostado", "san lorenzo de tostado"],
      kickoff_at: kickoffIso("sabado", "12:00"),
      court: "Cancha 1",
    },
    {
      key: "sl-mascotas",
      homeHints: ["sl tostado", "sl de tostado", "san lorenzo de tostado"],
      awayHints: ["mascotas tostado", "mascotas de tostado"],
      kickoff_at: kickoffIso("sabado", "20:00"),
      court: "Cancha 4",
    },
  ];

  const applied: string[] = [];
  for (const wanted of desired2016) {
    const hit = (matches2016 ?? []).find((row) => {
      const home = teamById.get(row.home_team_id) ?? "";
      const away = teamById.get(row.away_team_id) ?? "";
      return pairMatches(home, away, wanted.homeHints, wanted.awayHints);
    });
    if (!hit) {
      throw new Error(`no se encontro ${wanted.key}`);
    }
    const home = teamById.get(hit.home_team_id);
    const away = teamById.get(hit.away_team_id);
    const { error } = await supabase
      .from("matches")
      .update({ kickoff_at: wanted.kickoff_at, court: wanted.court })
      .eq("id", hit.id);
    if (error) throw new Error(error.message);
    applied.push(`${wanted.key}: ${home} vs ${away} -> sab ${wanted.court}`);
  }

  const upserted: string[] = [];
  for (const [index, name] of FEMENINO_2013.entries()) {
    const slug = slugify(name);
    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .eq("category", "femenino")
      .eq("year_label", "2013")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("teams")
        .update({ name, group_name: "A", sort_order: index + 1 })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      upserted.push(`upd ${name}`);
      continue;
    }
    const { error } = await supabase.from("teams").insert({
      name,
      slug,
      category: "femenino",
      year_label: "2013",
      group_name: "A",
      sort_order: index + 1,
    });
    if (error) throw new Error(error.message);
    upserted.push(`ins ${name}`);
  }

  console.log(JSON.stringify({ ok: true, applied, upserted }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
