/**
 * Saca los grupos ficticios de 2016 y borra partidos de esa categoría.
 * No borra equipos: el coordinador los asigna después.
 *
 * Uso: node scripts/clear-2016-groups.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(file) {
  const raw = readFileSync(resolve(process.cwd(), file), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function isRealUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value) && !value.includes("SENSITIVE");
}

function isRealKey(value) {
  return typeof value === "string" && value.length > 20 && !value.includes("SENSITIVE");
}

const fromProcess = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

for (const file of [".env.local", ".env.production.local"]) {
  try {
    loadEnv(file);
  } catch {
    // el archivo puede no existir
  }
}

const url = [fromProcess.url, process.env.NEXT_PUBLIC_SUPABASE_URL].find(isRealUrl);
const key = [fromProcess.key, process.env.SUPABASE_SERVICE_ROLE_KEY].find(isRealKey);
if (!url || !key) {
  console.error("Faltan credenciales reales de Supabase. Corrélo con: npx vercel env run --environment production --yes --scope rafa-ceccotti -- node scripts/clear-2016-groups.mjs");
  process.exit(1);
}

process.env.NEXT_PUBLIC_SUPABASE_URL = url;
process.env.SUPABASE_SERVICE_ROLE_KEY = key;

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const YEAR = "2016";

const { data: beforeTeams, error: beforeError } = await supabase
  .from("teams")
  .select("id, name, category, year_label, group_name")
  .eq("year_label", YEAR)
  .order("category")
  .order("name");

if (beforeError) {
  console.error("Error leyendo equipos:", beforeError.message);
  process.exit(1);
}

const { count: matchCount, error: matchCountError } = await supabase
  .from("matches")
  .select("*", { count: "exact", head: true })
  .eq("year_label", YEAR);

if (matchCountError) {
  console.error("Error contando partidos:", matchCountError.message);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      before: (beforeTeams ?? []).map((team) => ({
        name: team.name,
        category: team.category,
        group: team.group_name || null,
      })),
      teamsCount: beforeTeams?.length ?? 0,
      matchesCount: matchCount ?? 0,
    },
    null,
    2,
  ),
);

const { data: deletedMatches, error: deleteMatchesError } = await supabase
  .from("matches")
  .delete()
  .eq("year_label", YEAR)
  .select("id");

if (deleteMatchesError) {
  console.error("Error borrando partidos 2016:", deleteMatchesError.message);
  process.exit(1);
}

const { data: updatedTeams, error: clearGroupsError } = await supabase
  .from("teams")
  .update({ group_name: "" })
  .eq("year_label", YEAR)
  .select("id, name, category, group_name");

if (clearGroupsError) {
  console.error("Error vaciando grupos 2016:", clearGroupsError.message);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      teamsKept: (updatedTeams ?? []).map((team) => ({
        name: team.name,
        category: team.category,
        group: team.group_name || null,
      })),
      teamsCount: updatedTeams?.length ?? 0,
      matchesDeleted: deletedMatches?.length ?? 0,
    },
    null,
    2,
  ),
);
