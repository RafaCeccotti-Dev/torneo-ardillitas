import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { deleteAutoCreatedPortals, isMissingRelation } from "@/lib/accreditation-server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const HEALTH_TOKEN = "ardillitas-acred-health-2026";

async function authorize(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token === HEALTH_TOKEN) {
    if (!hasServiceRole()) {
      return {
        error: NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 }),
      };
    }
    try {
      return { supabase: createServiceClient() };
    } catch (err) {
      return {
        error: NextResponse.json(
          { error: err instanceof Error ? err.message : "Supabase no disponible" },
          { status: 503 },
        ),
      };
    }
  }
  return requireAdmin();
}

async function probeTable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  name: string,
) {
  const { error, count } = await supabase.from(name).select("*", { count: "exact", head: true });
  if (error) {
    return {
      ok: false,
      missing: isMissingRelation(error, name),
      error: error.message,
    };
  }
  return { ok: true, count: count ?? 0 };
}

export async function GET(request: Request) {
  const auth = await authorize(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const tables: Record<string, unknown> = {};
  for (const name of [
    "teams",
    "site_documents",
    "accreditation_portals",
    "accreditation_portal_teams",
    "accreditation_players",
    "accreditation_staff",
    "accreditation_submissions",
  ]) {
    tables[name] = await probeTable(supabase, name);
  }

  const { data: teams } = await supabase.from("teams").select("id, name");
  const { data: portals } = await supabase.from("accreditation_portals").select("id, name");
  const { data: players } = await supabase.from("accreditation_players").select("id, team_id, dni");
  const { data: staff } = await supabase.from("accreditation_staff").select("id, team_id, role, dni");

  const clubNames = Array.from(
    new Set((teams ?? []).map((t: { name: string }) => t.name)),
  ).sort((a, b) => a.localeCompare(b, "es"));
  const linked = new Set((portals ?? []).map((p: { name: string }) => p.name));
  const clubsWithoutPortal = clubNames.filter((name) => !linked.has(name));

  const dniTeams = new Map<string, Set<string>>();
  for (const row of players ?? []) {
    const set = dniTeams.get(row.dni) ?? new Set<string>();
    set.add(row.team_id);
    dniTeams.set(row.dni, set);
  }

  const staffDniTeams = new Map<string, Set<string>>();
  for (const row of staff ?? []) {
    if (!row.dni) continue;
    const set = staffDniTeams.get(row.dni) ?? new Set<string>();
    set.add(row.team_id);
    staffDniTeams.set(row.dni, set);
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim().replace(/\s/g, "");
  let smtp: { ok: boolean; error: string | null } = { ok: false, error: "sin configurar" };
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });
      await transporter.verify();
      smtp = { ok: true, error: null };
    } catch (err) {
      const raw = err instanceof Error ? err.message : "error smtp";
      smtp = {
        ok: false,
        error: /invalid login|username and password|authentication/i.test(raw)
          ? "auth"
          : "conexion",
      };
    }
  }

  return NextResponse.json({
    ok: true,
    gmailConfigured: Boolean(gmailUser && gmailPass),
    smtp,
    coordinatorEmail: "torneoardillitas@gmail.com",
    tables,
    teams: teams?.length ?? 0,
    clubs: clubNames.length,
    portals: portals?.length ?? 0,
    clubsWithoutPortal,
    players: players?.length ?? 0,
    staff: staff?.length ?? 0,
    playersRepeatedAcrossCategories: Array.from(dniTeams.values()).filter((s) => s.size > 1)
      .length,
    staffRepeatedAcrossCategories: Array.from(staffDniTeams.values()).filter((s) => s.size > 1)
      .length,
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const result = await deleteAutoCreatedPortals(supabase);
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...result });
}
