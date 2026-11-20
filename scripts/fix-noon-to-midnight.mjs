/**
 * Pasa partidos de 12:00 (mediodía / 12pm) a 00:00 (medianoche / 12am) hora Argentina.
 * Uso: node scripts/fix-noon-to-midnight.mjs
 *      node scripts/fix-noon-to-midnight.mjs --apply
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
  console.error("Faltan credenciales reales de Supabase");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TZ = "America/Argentina/Buenos_Aires";
const apply = process.argv.includes("--apply");

function artClock(iso) {
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

const { data: matches, error } = await supabase
  .from("matches")
  .select("id, category, year_label, phase, court, kickoff_at, home_team_id, away_team_id")
  .order("kickoff_at", { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const noon = (matches ?? []).filter((match) => artClock(match.kickoff_at).time === "12:00");
const times = {};
for (const match of matches ?? []) {
  const { time } = artClock(match.kickoff_at);
  times[time] = (times[time] ?? 0) + 1;
}

console.log(
  JSON.stringify(
    {
      total: matches?.length ?? 0,
      times,
      noonCount: noon.length,
      noon: noon.map((match) => ({
        id: match.id,
        category: match.category,
        year: match.year_label,
        court: match.court,
        from: match.kickoff_at,
        art: artClock(match.kickoff_at),
        toArt: `${artClock(match.kickoff_at).day} 00:00`,
      })),
      apply,
    },
    null,
    2,
  ),
);

if (!apply || noon.length === 0) process.exit(0);

for (const match of noon) {
  const { day } = artClock(match.kickoff_at);
  const nextIso = new Date(`${day}T00:00:00-03:00`).toISOString();
  const { error: updateError } = await supabase.from("matches").update({ kickoff_at: nextIso }).eq("id", match.id);
  if (updateError) {
    console.error("Error actualizando", match.id, updateError.message);
    process.exit(1);
  }
}

console.log(JSON.stringify({ ok: true, updated: noon.length }));
