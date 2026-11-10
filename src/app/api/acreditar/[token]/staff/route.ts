import { NextResponse } from "next/server";

import {
  MAX_STAFF_PER_CATEGORY,
  STAFF_ROLES,
  type StaffRole,
} from "@/lib/accreditation";
import {
  assertTeamEditable,
  assertTeamInPortal,
  categoryLockedResponse,
  isTeamSubmitted,
} from "@/lib/accreditation-access";
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

  const access = await assertTeamEditable(supabase, params.token, teamId);
  if ("error" in access && access.error) return access.error;

  if (!STAFF_ROLES.some((item) => item.value === role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }
  if (firstName.length < 2 || lastName.length < 2) {
    return NextResponse.json({ error: "Nombre y apellido obligatorios" }, { status: 400 });
  }

  const { count } = await supabase
    .from("accreditation_staff")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  if ((count ?? 0) >= MAX_STAFF_PER_CATEGORY) {
    return NextResponse.json(
      {
        error: `Ya cargaste ${MAX_STAFF_PER_CATEGORY} delegados/cuerpo técnico (máximo por categoría)`,
      },
      { status: 400 },
    );
  }

  // Se puede repetir la misma persona en otra categoría del club.
  const { data, error } = await supabase
    .from("accreditation_staff")
    .insert({
      team_id: teamId,
      role,
      first_name: firstName,
      last_name: lastName,
      dni,
      phone,
    })
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

  const access = await assertTeamInPortal(supabase, params.token, row.team_id);
  if (!access.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (await isTeamSubmitted(supabase, row.team_id)) {
    return categoryLockedResponse();
  }

  const { error } = await supabase.from("accreditation_staff").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
