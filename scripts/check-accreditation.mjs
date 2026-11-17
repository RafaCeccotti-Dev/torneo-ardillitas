/**
 * Diagnóstico de acreditación en prod. No imprime secretos.
 * Uso: vercel env run --environment production --yes --scope rafa-ceccotti -- node scripts/check-accreditation.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const gmailUser = process.env.GMAIL_USER?.trim();
const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

const report = {
  supabaseUrlHost: url ? new URL(url).host : null,
  hasServiceRole: Boolean(service && !service.includes("SENSITIVE")),
  gmailConfigured: Boolean(gmailUser && gmailPass && !gmailUser.includes("SENSITIVE")),
  tables: {},
  clubs: 0,
  teams: 0,
  portals: 0,
  clubsWithoutPortal: [],
  players: 0,
  staff: 0,
  duplicateDniAcrossTeams: 0,
  duplicateDniSameTeam: 0,
  errors: [],
};

if (!url || !service || service.includes("SENSITIVE")) {
  report.errors.push("Faltan credenciales reales de Supabase en el entorno");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const supabase = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function tableCheck(name, select = "id") {
  const { error, count } = await supabase.from(name).select(select, { count: "exact", head: true });
  if (error) {
    report.tables[name] = { ok: false, error: error.message };
    return false;
  }
  report.tables[name] = { ok: true, count: count ?? 0 };
  return true;
}

for (const name of [
  "teams",
  "site_documents",
  "accreditation_portals",
  "accreditation_portal_teams",
  "accreditation_players",
  "accreditation_staff",
  "accreditation_submissions",
]) {
  await tableCheck(name);
}

const { data: teams, error: teamsError } = await supabase
  .from("teams")
  .select("id, name, category, year_label, group_name");
if (teamsError) {
  report.errors.push(`teams: ${teamsError.message}`);
} else {
  report.teams = teams.length;
  report.clubs = new Set(teams.map((t) => t.name)).size;
}

const { data: portals, error: portalsError } = await supabase
  .from("accreditation_portals")
  .select("id, name, token");
if (portalsError) {
  report.errors.push(`portals: ${portalsError.message}`);
} else {
  report.portals = portals.length;
  const linked = new Set(portals.map((p) => p.name));
  const clubNames = [...new Set((teams ?? []).map((t) => t.name))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  report.clubsWithoutPortal = clubNames.filter((name) => !linked.has(name));
}

const { data: players, error: playersError } = await supabase
  .from("accreditation_players")
  .select("id, team_id, dni");
if (playersError) {
  report.errors.push(`players: ${playersError.message}`);
} else {
  report.players = players.length;
  const byTeamDni = new Map();
  const byDniTeams = new Map();
  for (const p of players) {
    const k = `${p.team_id}:${p.dni}`;
    byTeamDni.set(k, (byTeamDni.get(k) ?? 0) + 1);
    const set = byDniTeams.get(p.dni) ?? new Set();
    set.add(p.team_id);
    byDniTeams.set(p.dni, set);
  }
  report.duplicateDniSameTeam = [...byTeamDni.values()].filter((n) => n > 1).length;
  report.duplicateDniAcrossTeams = [...byDniTeams.values()].filter((s) => s.size > 1).length;
}

const { data: staff, error: staffError } = await supabase
  .from("accreditation_staff")
  .select("id, team_id, role, dni");
if (staffError) {
  report.errors.push(`staff: ${staffError.message}`);
} else {
  report.staff = staff.length;
}

console.log(JSON.stringify(report, null, 2));
