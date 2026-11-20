import { NextResponse } from "next/server";

import {
  MAX_STAFF_PER_CATEGORY,
  STAFF_KINDS,
  STAFF_ROLES,
  nextStaffRole,
  type StaffKind,
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

async function loadStaff(
  supabase: ReturnType<typeof createServiceClient>,
  teamId: string,
) {
  const { data, error } = await supabase
    .from("accreditation_staff")
    .select("id, role, first_name, last_name, dni, phone")
    .eq("team_id", teamId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

function isStaffKind(value: string): value is StaffKind {
  return STAFF_KINDS.some((item) => item.value === value);
}

function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.some((item) => item.value === value);
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
  const copyFromTeamId = String(body.copyFromTeamId ?? "").trim();

  const access = await assertTeamEditable(supabase, params.token, teamId);
  if ("error" in access && access.error) return access.error;

  let existing: Awaited<ReturnType<typeof loadStaff>>;
  try {
    existing = await loadStaff(supabase, teamId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo leer el cuerpo técnico" },
      { status: 500 },
    );
  }

  const room = MAX_STAFF_PER_CATEGORY - existing.length;
  if (room <= 0) {
    return NextResponse.json(
      {
        error: `Ya cargaste ${MAX_STAFF_PER_CATEGORY} profes/delegados (máximo por categoría)`,
      },
      { status: 400 },
    );
  }

  if (copyFromTeamId) {
    if (copyFromTeamId === teamId) {
      return NextResponse.json({ error: "Elegí otra categoría para copiar" }, { status: 400 });
    }
    const sourceAccess = await assertTeamInPortal(supabase, params.token, copyFromTeamId);
    if (!sourceAccess.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data: source, error: sourceError } = await supabase
      .from("accreditation_staff")
      .select("role, first_name, last_name, dni, phone")
      .eq("team_id", copyFromTeamId);
    if (sourceError) {
      return NextResponse.json({ error: sourceError.message }, { status: 500 });
    }
    const toCopy = (source ?? []).slice(0, room);
    if (!toCopy.length) {
      return NextResponse.json(
        { error: "Esa categoría no tiene cuerpo técnico para copiar" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("accreditation_staff").insert(
      toCopy.map((member) => ({
        team_id: teamId,
        role: member.role,
        first_name: member.first_name,
        last_name: member.last_name,
        dni: member.dni ?? "",
        phone: member.phone ?? "",
      })),
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, copied: toCopy.length });
  }

  const kindRaw = String(body.kind ?? "").trim();
  const roleRaw = String(body.role ?? "").trim();
  let role: StaffRole | null = null;

  if (isStaffKind(kindRaw)) {
    role = nextStaffRole(kindRaw, existing);
    if (!role) {
      return NextResponse.json(
        { error: "Ya cargaste el máximo para ese rol en esta categoría" },
        { status: 400 },
      );
    }
  } else if (isStaffRole(roleRaw)) {
    role = roleRaw;
  } else {
    role = nextStaffRole("profe", existing) ?? nextStaffRole("delegado", existing);
  }

  if (!role) {
    return NextResponse.json(
      { error: `Ya cargaste ${MAX_STAFF_PER_CATEGORY} profes/delegados (máximo por categoría)` },
      { status: 400 },
    );
  }

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const dni = String(body.dni ?? "").replace(/\D/g, "");
  const phone = String(body.phone ?? "").trim();

  if (firstName.length < 2 || lastName.length < 2) {
    return NextResponse.json({ error: "Nombre y apellido obligatorios" }, { status: 400 });
  }

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

  const after = await loadStaff(supabase, teamId);
  if (after.length > MAX_STAFF_PER_CATEGORY) {
    await supabase.from("accreditation_staff").delete().eq("id", data.id);
    return NextResponse.json(
      {
        error: `Ya cargaste ${MAX_STAFF_PER_CATEGORY} profes/delegados (máximo por categoría)`,
      },
      { status: 400 },
    );
  }

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
