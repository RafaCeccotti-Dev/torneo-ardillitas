import { NextResponse } from "next/server";

import { MAX_PLAYERS_PER_CATEGORY } from "@/lib/accreditation";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";

const DEMO_PLAYERS = [
  ["Mateo", "Gonzalez", "45123401", "2015-03-12"],
  ["Thiago", "Lopez", "45123402", "2015-05-21"],
  ["Benjamín", "Fernandez", "45123403", "2015-01-08"],
  ["Valentino", "Rodriguez", "45123404", "2015-07-30"],
  ["Santino", "Martinez", "45123405", "2015-09-14"],
  ["Bautista", "Sanchez", "45123406", "2015-11-02"],
  ["Felipe", "Perez", "45123407", "2015-02-19"],
  ["Lautaro", "Gomez", "45123408", "2015-04-25"],
  ["Joaquín", "Diaz", "45123409", "2015-06-11"],
  ["Tomás", "Alvarez", "45123410", "2015-08-03"],
  ["Agustín", "Romero", "45123411", "2015-10-17"],
  ["Ignacio", "Sosa", "45123412", "2015-12-09"],
  ["Facundo", "Torres", "45123413", "2015-01-28"],
  ["Nicolás", "Ruiz", "45123414", "2015-03-05"],
  ["Franco", "Castro", "45123415", "2015-05-16"],
  ["Maximiliano", "Moreno", "45123416", "2015-07-22"],
] as const;

const DEMO_STAFF = [
  { role: "dt", firstName: "Carlos", lastName: "Ramirez", dni: "20111222", phone: "3491555001" },
  {
    role: "ayudante",
    firstName: "Luis",
    lastName: "Herrera",
    dni: "22333444",
    phone: "3491555002",
  },
  {
    role: "delegado",
    firstName: "María",
    lastName: "Acosta",
    dni: "24555666",
    phone: "3491555003",
  },
] as const;

function serviceOrError() {
  if (!hasServiceRole()) {
    return {
      error: NextResponse.json(
        { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." },
        { status: 503 },
      ),
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

/** Carga un plantel de ejemplo (16 jugadores + 3 staff) para probar el PDF. */
export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  const svc = serviceOrError();
  if ("error" in svc && svc.error) return svc.error;
  const { supabase } = svc;

  const body = (await request.json().catch(() => ({}))) as { teamId?: string };
  const teamId = String(body.teamId ?? "").trim();
  if (!teamId) return NextResponse.json({ error: "Falta teamId" }, { status: 400 });

  const { data: portal } = await supabase
    .from("accreditation_portals")
    .select("id, name")
    .eq("token", params.token)
    .maybeSingle();
  if (!portal) return NextResponse.json({ error: "Link inválido" }, { status: 404 });

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .maybeSingle();
  if (!team || team.name !== portal.name) {
    return NextResponse.json({ error: "Equipo no autorizado" }, { status: 403 });
  }

  await supabase.from("accreditation_players").delete().eq("team_id", teamId);
  await supabase.from("accreditation_staff").delete().eq("team_id", teamId);

  const players = DEMO_PLAYERS.slice(0, MAX_PLAYERS_PER_CATEGORY).map((row, index) => ({
    team_id: teamId,
    first_name: row[0],
    last_name: row[1],
    dni: row[2],
    birth_date: row[3],
    jersey_number: index + 1,
    dni_photo_path: null,
  }));

  const { error: playersError } = await supabase.from("accreditation_players").insert(players);
  if (playersError) {
    return NextResponse.json({ error: playersError.message }, { status: 500 });
  }

  const staffRows = DEMO_STAFF.map((member) => ({
    team_id: teamId,
    role: member.role,
    first_name: member.firstName,
    last_name: member.lastName,
    dni: member.dni,
    phone: member.phone,
  }));

  const { error: staffError } = await supabase.from("accreditation_staff").insert(staffRows);
  if (staffError) {
    return NextResponse.json({ error: staffError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    players: players.length,
    staff: staffRows.length,
    club: portal.name,
    teamId,
  });
}
