import { readFileSync } from "fs";
import { resolve } from "path";

import {
  categoryLabel,
  MAX_PLAYERS_PER_CATEGORY,
  MAX_STAFF_PER_CATEGORY,
} from "@/lib/accreditation";
import { buildAccreditationPdf, normalizeRosterPlayers, parseJerseyNumber } from "@/lib/accreditation-pdf";
import { assertAccreditationPdf } from "@/lib/accreditation-pdf-assert";
import { getSentMap } from "@/lib/accreditation-server";
import { buildRosterEmailText } from "@/lib/roster-email-text";
import { COORDINATOR_EMAIL, sendPdfEmail } from "@/lib/send-email";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/public";

type TeamRow = {
  id: string;
  name: string;
  category: string;
  year_label: string;
  group_name: string | null;
};

function loadEnv(file: string, overwrite: boolean) {
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\uFEFF/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    val = val.trim();
    if (overwrite || !process.env[key]) process.env[key] = val;
  }
}

function looksLikeJwt(value: string | undefined) {
  return Boolean(value && value.startsWith("eyJ") && value.length > 80);
}

if (!looksLikeJwt(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  loadEnv(resolve(process.cwd(), ".env.local"), false);
  loadEnv(resolve(process.cwd(), ".env.production.local"), true);
}

const PUBLIC_SUPABASE = "https://gendmwgzxtqxpntthlvc.supabase.co";
if (!/^https:\/\//i.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = PUBLIC_SUPABASE;
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "local-placeholder";
}

function fold(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function yearOf(team: TeamRow) {
  return String(team.year_label ?? "").trim();
}

function matchesResend(team: TeamRow) {
  if (team.category !== "masculino") return false;
  const name = fold(team.name);
  const year = yearOf(team);
  const group = fold(String(team.group_name ?? ""));

  if (year === "2017" && /atletico( de)? rafaela/.test(name) && !/9 de julio/.test(name)) {
    return group === "c" || group === "";
  }
  if (year === "2016" && /central ceres/.test(name) && !/atletico/.test(name)) {
    return group === "c" || group === "";
  }
  if (
    (year === "2019/2020" || year === "2019") &&
    /atletico ceres/.test(name) &&
    /azul/.test(name)
  ) {
    return true;
  }
  return false;
}

function isSelvaFemenino(team: TeamRow) {
  if (team.category !== "femenino") return false;
  const name = fold(team.name);
  return /atletico selva/.test(name) || /(^|\s)selva(\s|$)/.test(name);
}

async function inspectSelva(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  teams: TeamRow[],
) {
  const selected = teams.filter(isSelvaFemenino);
  if (!selected.length) {
    return {
      found: false,
      note: "No hay equipo Atletico Selva femenino en teams",
      nearby: teams
        .filter((t) => t.category === "femenino" || /selva/i.test(t.name))
        .map((t) => `${t.name} · ${t.year_label} · ${t.category} · G${t.group_name ?? "-"}`),
    };
  }

  const sentMap = await getSentMap(
    supabase,
    selected.map((t) => t.id),
  );
  const { data: portals } = await supabase.from("accreditation_portals").select("id, name");
  const portalNames = new Set((portals ?? []).map((p: { name: string }) => p.name));

  const details = [];
  for (const team of selected) {
    const [{ data: players }, { data: staff }] = await Promise.all([
      supabase
        .from("accreditation_players")
        .select("first_name, last_name, jersey_number")
        .eq("team_id", team.id),
      supabase.from("accreditation_staff").select("id").eq("team_id", team.id),
    ]);
    const playerRows = (players ?? []) as Array<{
      first_name: string;
      last_name: string;
      jersey_number: number | null;
    }>;
    const completePlayers = playerRows.filter(
      (p) =>
        String(p.first_name ?? "").trim() &&
        String(p.last_name ?? "").trim() &&
        parseJerseyNumber(p.jersey_number) != null,
    );
    const sentAt = sentMap.get(team.id) ?? null;
    details.push({
      team: team.name,
      year: team.year_label,
      group: team.group_name,
      portal: portalNames.has(team.name),
      players: playerRows.length,
      completePlayers: completePlayers.length,
      staff: (staff ?? []).length,
      sentAt,
      completedButNotSent: completePlayers.length > 0 && !sentAt,
    });
  }
  return { found: true, details };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let urlHost = "bad";
  try {
    urlHost = new URL(url).host;
  } catch {
    urlHost = "bad";
  }
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  console.error(
    JSON.stringify({
      urlHost,
      serviceLen: service.length,
      serviceJwt: service.startsWith("eyJ"),
      gmail: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    }),
  );
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    throw new Error("Faltan variables de Supabase");
  }
  const supabase = createServiceClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name, category, year_label, group_name");
  if (error) throw new Error(error.message);

  const allTeams = (teams ?? []) as TeamRow[];
  const selvaFemenino = await inspectSelva(supabase, allTeams);
  const selected = allTeams.filter(matchesResend);

  const payload: Record<string, unknown> = {
    matched: selected.map((t) => `${t.name} · ${t.year_label} · G${t.group_name ?? "-"}`),
    selvaFemenino,
    sent: [] as Array<Record<string, unknown>>,
  };

  if (!selected.length) {
    payload.ok = false;
    payload.available = allTeams
      .filter((t) => /rafaela|central ceres|atletico ceres|azul/i.test(t.name))
      .map((t) => `${t.name} · ${t.year_label} · ${t.category} · G${t.group_name ?? "-"}`);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const sentMap = await getSentMap(
    supabase,
    selected.map((t) => t.id),
  );
  const results: Array<Record<string, unknown>> = [];

  for (const team of selected) {
    const [{ data: players, error: playersError }, { data: staff, error: staffError }] =
      await Promise.all([
        supabase
          .from("accreditation_players")
          .select("first_name, last_name, dni, birth_date, jersey_number")
          .eq("team_id", team.id),
        supabase
          .from("accreditation_staff")
          .select("role, first_name, last_name, dni, phone")
          .eq("team_id", team.id),
      ]);

    if (playersError || staffError || !players?.length) {
      results.push({
        team: team.name,
        year: team.year_label,
        error: playersError?.message || staffError?.message || "Sin jugadores",
      });
      continue;
    }

    let rosterPlayers;
    try {
      rosterPlayers = normalizeRosterPlayers(
        players.slice(0, MAX_PLAYERS_PER_CATEGORY).map((p) => ({
          firstName: p.first_name,
          lastName: p.last_name,
          dni: p.dni,
          birthDate: p.birth_date,
          jerseyNumber: parseJerseyNumber(p.jersey_number),
        })),
      );
    } catch (err) {
      results.push({
        team: team.name,
        year: team.year_label,
        error: err instanceof Error ? err.message : "Plantel incompleto",
      });
      continue;
    }

    const rosterStaff = (staff ?? []).slice(0, MAX_STAFF_PER_CATEGORY).map((s) => ({
      role: s.role,
      firstName: s.first_name,
      lastName: s.last_name,
      dni: s.dni ?? "",
      phone: s.phone ?? "",
    }));
    const label = categoryLabel(team);
    const emailText = buildRosterEmailText({
      clubName: team.name,
      categoryLabel: label,
      players: rosterPlayers,
      staff: rosterStaff,
    });

    try {
      const pdfBytes = await buildAccreditationPdf({
        clubName: team.name,
        categoryLabel: label,
        players: rosterPlayers,
        staff: rosterStaff,
      });
      try {
        await assertAccreditationPdf(pdfBytes, {
          clubName: team.name,
          categoryLabel: label,
          players: rosterPlayers,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (!/fake worker|pdf\.worker/i.test(msg)) throw err;
      }

      const filename = `plantel-${team.name}-${team.year_label}.pdf`
        .replace(/\s+/g, "-")
        .toLowerCase();
      const result = await sendPdfEmail({
        to: COORDINATOR_EMAIL,
        subject: `Inscripción plantel (corregida) · ${team.name} · ${label}`,
        text: emailText,
        pdfBytes,
        filename,
      });
      if (!result) {
        results.push({ team: team.name, year: team.year_label, error: "No hay mailer" });
        continue;
      }
      results.push({
        team: team.name,
        year: team.year_label,
        players: rosterPlayers.length,
        staff: rosterStaff.length,
        alreadySent: sentMap.has(team.id),
        provider: result.provider,
        to: COORDINATOR_EMAIL,
      });
    } catch (err) {
      results.push({
        team: team.name,
        year: team.year_label,
        error: err instanceof Error ? err.message : "PDF",
      });
    }
  }

  payload.ok = true;
  payload.sent = results;
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "fail");
  process.exit(1);
});
