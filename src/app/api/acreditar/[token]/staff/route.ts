import { NextResponse } from "next/server";

import { STAFF_ROLES, type StaffRole } from "@/lib/accreditation";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";

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

async function assertTeamInPortal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  token: string,
  teamId: string,
) {
  const { data: portal } = await supabase
    .from("accreditation_portals")
    .select("id, name")
    .eq("token", token)
    .maybeSingle();
  if (!portal) return false;
  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .maybeSingle();
  return Boolean(team && team.name === portal.name);
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  const svc = serviceOrError();
  if ("error" in svc && svc.error) return svc.error;
  const { supabase } = svc;

  const body = await request.json();
  const teamId = String(body.teamId ?? "").trim();
  const role = String(body.role ?? "dt") as StaffRole;
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const dni = String(body.dni ?? "").replace(/\D/g, "");
  const phone = String(body.phone ?? "").trim();

  if (!(await assertTeamInPortal(supabase, params.token, teamId))) {
    return NextResponse.json({ error: "Equipo no autorizado" }, { status: 403 });
  }
  if (!STAFF_ROLES.some((item) => item.value === role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }
  if (firstName.length < 2 || lastName.length < 2) {
    return NextResponse.json({ error: "Nombre y apellido obligatorios" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("accreditation_staff")
    .upsert(
      {
        team_id: teamId,
        role,
        first_name: firstName,
        last_name: lastName,
        dni,
        phone,
      },
      { onConflict: "team_id,role" },
    )
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(
  request: Request,
  { params }: { params: { token: string } },
) {
  const svc = serviceOrError();
  if ("error" in svc && svc.error) return svc.error;
  const { supabase } = svc;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { data: row } = await supabase
    .from("accreditation_staff")
    .select("id, team_id")
    .eq("id", id)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!(await assertTeamInPortal(supabase, params.token, row.team_id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await supabase.from("accreditation_staff").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
