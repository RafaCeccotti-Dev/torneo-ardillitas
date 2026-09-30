import { NextResponse } from "next/server";

import {
  MAX_PLAYERS_PER_CATEGORY,
  normalizeDni,
  parseBirthDate,
} from "@/lib/accreditation";
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

  const formData = await request.formData();
  const teamId = String(formData.get("teamId") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const dni = normalizeDni(String(formData.get("dni") ?? ""));
  const birthRaw = String(formData.get("birthDate") ?? "");
  const birthDate = parseBirthDate(birthRaw);
  const jerseyNumber = Number(formData.get("jerseyNumber"));

  if (!(await assertTeamInPortal(supabase, params.token, teamId))) {
    return NextResponse.json({ error: "Equipo no autorizado en este link" }, { status: 403 });
  }
  if (firstName.length < 2 || lastName.length < 2) {
    return NextResponse.json({ error: "Nombre y apellido obligatorios" }, { status: 400 });
  }
  if (dni.length < 7 || dni.length > 8) {
    return NextResponse.json({ error: "DNI inválido (7 u 8 números, sin puntos)" }, { status: 400 });
  }
  if (!birthDate) {
    return NextResponse.json({ error: "Fecha de nacimiento inválida (dd/mm/aaaa)" }, { status: 400 });
  }
  if (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99) {
    return NextResponse.json({ error: "Elegí un número de camiseta del 1 al 99" }, { status: 400 });
  }

  const { count } = await supabase
    .from("accreditation_players")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  if ((count ?? 0) >= MAX_PLAYERS_PER_CATEGORY) {
    return NextResponse.json(
      { error: `Ya están ${MAX_PLAYERS_PER_CATEGORY} jugadores en esta categoría` },
      { status: 400 },
    );
  }

  // La foto del DNI solo se usa en el celular para OCR; no se guarda.
  const { data, error } = await supabase
    .from("accreditation_players")
    .insert({
      team_id: teamId,
      first_name: firstName,
      last_name: lastName,
      dni,
      birth_date: birthDate,
      jersey_number: jerseyNumber,
      dni_photo_path: null,
    })
    .select("id")
    .single();

  if (error) {
    const msg = error.message.includes("jersey_number")
      ? "Ese número de camiseta ya está usado en esta categoría"
      : error.message.includes("dni")
        ? "Ese DNI ya está cargado en esta categoría"
        : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
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

  const playerId = new URL(request.url).searchParams.get("id");
  if (!playerId) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { data: player } = await supabase
    .from("accreditation_players")
    .select("id, team_id")
    .eq("id", playerId)
    .maybeSingle();

  if (!player) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  if (!(await assertTeamInPortal(supabase, params.token, player.team_id))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await supabase.from("accreditation_players").delete().eq("id", playerId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
