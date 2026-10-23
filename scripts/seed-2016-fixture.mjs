/**
 * Prueba: masculino 2016 — 4 grupos (A–D), todos vs todos + resultados,
 * cuartos 1A-2B / 1B-2A / 1C-2D / 1D-2C.
 *
 * Uso: node scripts/seed-2016-fixture.mjs
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
    // Forzar overwrite: el shell de Cursor a veces inyecta placeholders [SENSITIVE]
    process.env[key] = value;
  }
}

loadEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CATEGORY = "masculino";
const YEAR = "2016";
const GROUPS = ["A", "B", "C", "D"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundRobinPairs(teams) {
  // 4 equipos → 6 partidos (todos vs todos)
  const pairs = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push([teams[i], teams[j]]);
    }
  }
  return pairs;
}

function randomScore() {
  // Resultados creíbles infantiles: 0–5
  const home = Math.floor(Math.random() * 6);
  let away = Math.floor(Math.random() * 6);
  // Evitar empates excesivos (~25% empate)
  if (Math.random() > 0.25 && home === away) {
    away = (away + 1 + Math.floor(Math.random() * 2)) % 6;
  }
  return { home, away };
}

function kickoffIso(date, time) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

function computeStandings(teams, matches) {
  const rows = new Map(
    teams.map((t) => [
      t.id,
      {
        team: t,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        pts: 0,
      },
    ]),
  );

  for (const m of matches) {
    if (m.home_score == null || m.away_score == null) continue;
    const home = rows.get(m.home_team_id);
    const away = rows.get(m.away_team_id);
    if (!home || !away) continue;
    home.played += 1;
    away.played += 1;
    home.gf += m.home_score;
    home.ga += m.away_score;
    away.gf += m.away_score;
    away.ga += m.home_score;
    if (m.home_score > m.away_score) {
      home.won += 1;
      home.pts += 3;
      away.lost += 1;
    } else if (m.home_score < m.away_score) {
      away.won += 1;
      away.pts += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }

  return [...rows.values()].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const da = a.gf - a.ga;
    const db = b.gf - b.ga;
    if (db !== da) return db - da;
    return b.gf - a.gf;
  });
}

async function main() {
  console.log(`=== Seed fixture ${CATEGORY} ${YEAR} ===`);

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, slug, group_name, sort_order")
    .eq("category", CATEGORY)
    .eq("year_label", YEAR)
    .order("name", { ascending: true });

  if (teamsError) throw teamsError;
  if (!teams?.length) {
    console.error("No hay equipos en masculino 2016");
    process.exit(1);
  }
  if (teams.length !== 16) {
    console.warn(`Ojo: hay ${teams.length} equipos (se esperaban 16). Sigo igual.`);
  }

  console.log(`Equipos encontrados: ${teams.length}`);
  teams.forEach((t) => console.log(`  - ${t.name} (grupo actual: ${t.group_name || "—"})`));

  // Borrar partidos previos de esta categoría/año (prueba limpia)
  const { error: delError, count } = await supabase
    .from("matches")
    .delete({ count: "exact" })
    .eq("category", CATEGORY)
    .eq("year_label", YEAR);

  if (delError) throw delError;
  console.log(`Partidos anteriores borrados: ${count ?? "?"}`);

  // Sorteo aleatorio en 4 grupos
  const shuffled = shuffle(teams);
  const byGroup = { A: [], B: [], C: [], D: [] };
  shuffled.forEach((team, i) => {
    const g = GROUPS[i % 4];
    byGroup[g].push(team);
  });
  // Rebalancear a exactamente 4 por grupo si hay 16
  if (teams.length === 16) {
    const pool = shuffle(teams);
    byGroup.A = pool.slice(0, 4);
    byGroup.B = pool.slice(4, 8);
    byGroup.C = pool.slice(8, 12);
    byGroup.D = pool.slice(12, 16);
  }

  console.log("\n=== Grupos sorteados ===");
  for (const g of GROUPS) {
    console.log(`Grupo ${g}:`);
    byGroup[g].forEach((t, idx) => console.log(`  ${idx + 1}. ${t.name}`));
  }

  // Actualizar group_name + sort_order
  for (const g of GROUPS) {
    for (let i = 0; i < byGroup[g].length; i++) {
      const team = byGroup[g][i];
      const { error } = await supabase
        .from("teams")
        .update({ group_name: g, sort_order: GROUPS.indexOf(g) * 10 + i + 1 })
        .eq("id", team.id);
      if (error) throw error;
      team.group_name = g;
    }
  }

  // Fechas base (sábado/domingo ficticios del torneo)
  // Grupos: 3 jornadas (cada equipo juega 3 partidos)
  const groupDates = ["2026-11-07", "2026-11-08", "2026-11-14"];
  const groupTimes = ["09:00", "10:30", "12:00", "15:00", "16:30", "18:00"];
  const courts = ["Cancha 1", "Cancha 2", "Cancha 3", "Cancha 4"];

  const groupMatchesToInsert = [];
  let timeIdx = 0;

  for (const g of GROUPS) {
    const pairs = roundRobinPairs(byGroup[g]);
    // 6 partidos → repartir en 3 fechas (2 por fecha)
    pairs.forEach((pair, idx) => {
      const date = groupDates[Math.floor(idx / 2) % groupDates.length];
      const time = groupTimes[timeIdx % groupTimes.length];
      const court = courts[timeIdx % courts.length];
      timeIdx += 1;
      const { home, away } = randomScore();
      // Alternar local/visitante al azar
      const [homeTeam, awayTeam] = Math.random() > 0.5 ? pair : [pair[1], pair[0]];
      groupMatchesToInsert.push({
        category: CATEGORY,
        year_label: YEAR,
        phase: "grupos",
        round_label: `Grupo ${g} · Jornada ${Math.floor(idx / 2) + 1}`,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        home_score: home,
        away_score: away,
        kickoff_at: kickoffIso(date, time),
        court,
        status: "finalizado",
        _meta: { group: g, homeName: homeTeam.name, awayName: awayTeam.name, home, away },
      });
    });
  }

  const groupRows = groupMatchesToInsert.map(({ _meta, ...row }) => row);
  const { data: insertedGroups, error: insGroupError } = await supabase
    .from("matches")
    .insert(groupRows)
    .select("id, home_team_id, away_team_id, home_score, away_score");

  if (insGroupError) throw insGroupError;
  console.log(`\nPartidos de grupos insertados: ${insertedGroups.length}`);

  // Standings por grupo
  const tops = {};
  console.log("\n=== Posiciones ===");
  for (const g of GROUPS) {
    const teamIds = new Set(byGroup[g].map((t) => t.id));
    const groupMatchRows = insertedGroups.filter(
      (m) => teamIds.has(m.home_team_id) && teamIds.has(m.away_team_id),
    );
    const standings = computeStandings(byGroup[g], groupMatchRows);
    tops[g] = { first: standings[0].team, second: standings[1].team };
    console.log(`Grupo ${g}:`);
    standings.forEach((row, i) => {
      console.log(
        `  ${i + 1}. ${row.team.name}  ${row.pts} pts  (${row.gf}-${row.ga})`,
      );
    });
  }

  // Cuartos: 1A-2B, 1B-2A, 1C-2D, 1D-2C
  const qfDate = "2026-11-15";
  const quarterFinals = [
    {
      label: "Cuartos · 1°A vs 2°B",
      home: tops.A.first,
      away: tops.B.second,
      time: "09:00",
      court: "Cancha 1",
    },
    {
      label: "Cuartos · 1°B vs 2°A",
      home: tops.B.first,
      away: tops.A.second,
      time: "10:30",
      court: "Cancha 2",
    },
    {
      label: "Cuartos · 1°C vs 2°D",
      home: tops.C.first,
      away: tops.D.second,
      time: "12:00",
      court: "Cancha 3",
    },
    {
      label: "Cuartos · 1°D vs 2°C",
      home: tops.D.first,
      away: tops.C.second,
      time: "15:00",
      court: "Cancha 4",
    },
  ];

  const qfRows = quarterFinals.map((qf) => ({
    category: CATEGORY,
    year_label: YEAR,
    phase: "cruces",
    round_label: qf.label,
    home_team_id: qf.home.id,
    away_team_id: qf.away.id,
    home_score: null,
    away_score: null,
    kickoff_at: kickoffIso(qfDate, qf.time),
    court: qf.court,
    status: "programado",
  }));

  const { data: insertedQf, error: qfError } = await supabase
    .from("matches")
    .insert(qfRows)
    .select("id");

  if (qfError) throw qfError;

  console.log(`\nCuartos insertados: ${insertedQf.length}`);
  console.log("\n=== Cuartos de final (programados) ===");
  for (const qf of quarterFinals) {
    console.log(
      `  ${qf.label}: ${qf.home.name} vs ${qf.away.name} · ${qfDate} ${qf.time} · ${qf.court}`,
    );
  }

  console.log("\nListo. Miralo en /partidos y /tabla/masculino (categoría 2016).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
