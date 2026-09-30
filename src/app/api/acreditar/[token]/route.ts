import { NextResponse } from "next/server";

import {
  formatBirthDateDisplay,
  MAX_PLAYERS_PER_CATEGORY,
  type StaffRole,
} from "@/lib/accreditation";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";

function serviceOrError() {
  if (!hasServiceRole()) {
    return {
      error: NextResponse.json(
        {
          error:
            "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Pedile al admin que la configure.",
        },
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

function logoUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  path: string | null | undefined,
) {
  if (!path) return null;
  return supabase.storage.from("escudos").getPublicUrl(path).data.publicUrl as string;
}

async function loadPortalByToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  token: string,
) {
  const { data: portal, error } = await supabase
    .from("accreditation_portals")
    .select("id, token, name, logo_path")
    .eq("token", token)
    .maybeSingle();

  if (error || !portal) return null;

  // Categorías = todas las inscripciones actuales del club (por nombre)
  const { data: teamsRaw } = await supabase
    .from("teams")
    .select("id, name, category, year_label, group_name, logo_path")
    .eq("name", portal.name)
    .order("category", { ascending: true })
    .order("year_label", { ascending: true })
    .order("group_name", { ascending: true });

  const teams = teamsRaw ?? [];
  const teamIds = teams.map((t: { id: string }) => t.id);

  const playersRes = teamIds.length
    ? await supabase
        .from("accreditation_players")
        .select("id, team_id, first_name, last_name, dni, birth_date, jersey_number")
        .in("team_id", teamIds)
        .order("jersey_number", { ascending: true })
    : { data: [] as unknown[], error: null };

  // .in() a veces no trae filas en staff; consultamos por equipo.
  const staffChunks = teamIds.length
    ? await Promise.all(
        teamIds.map((id: string) =>
          supabase
            .from("accreditation_staff")
            .select("id, team_id, role, first_name, last_name, dni, phone")
            .eq("team_id", id),
        ),
      )
    : [];

  const players = playersRes.data;
  const staff = staffChunks.flatMap(
    (chunk: { data: Array<{
      id: string;
      team_id: string;
      role: StaffRole;
      first_name: string;
      last_name: string;
      dni: string;
      phone: string;
    }> | null }) => chunk.data ?? [],
  );

  const countByTeam = new Map<string, number>();
  for (const player of players ?? []) {
    countByTeam.set(player.team_id, (countByTeam.get(player.team_id) ?? 0) + 1);
  }

  const mappedPlayers = (players ?? []).map(
    (player: {
      id: string;
      team_id: string;
      first_name: string;
      last_name: string;
      dni: string;
      birth_date: string;
      jersey_number: number;
    }) => ({
      id: player.id,
      teamId: player.team_id,
      firstName: player.first_name,
      lastName: player.last_name,
      dni: player.dni,
      birthDate: player.birth_date,
      birthDateDisplay: formatBirthDateDisplay(player.birth_date),
      jerseyNumber: player.jersey_number,
      dniPhotoUrl: null,
    }),
  );

  return {
    portal: {
      id: portal.id,
      name: portal.name,
      logoUrl: logoUrl(
        supabase,
        portal.logo_path ||
          teams.find((t: { logo_path: string | null }) => t.logo_path)?.logo_path,
      ),
    },
    teams: teams.map(
      (team: {
        id: string;
        name: string;
        category: string;
        year_label: string;
        group_name: string;
        logo_path: string | null;
      }) => ({
        id: team.id,
        name: team.name,
        category: team.category,
        yearLabel: team.year_label,
        groupName: team.group_name,
        logoUrl: logoUrl(supabase, team.logo_path),
        playerCount: countByTeam.get(team.id) ?? 0,
      }),
    ),
    players: mappedPlayers,
    staff: (staff ?? []).map(
      (row: {
        id: string;
        team_id: string;
        role: StaffRole;
        first_name: string;
        last_name: string;
        dni: string;
        phone: string;
      }) => ({
        id: row.id,
        teamId: row.team_id,
        role: row.role,
        firstName: row.first_name,
        lastName: row.last_name,
        dni: row.dni,
        phone: row.phone,
      }),
    ),
    maxPlayers: MAX_PLAYERS_PER_CATEGORY,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const svc = serviceOrError();
  if ("error" in svc && svc.error) return svc.error;

  const data = await loadPortalByToken(svc.supabase, params.token);
  if (!data) {
    return NextResponse.json({ error: "Link inválido o vencido" }, { status: 404 });
  }
  return NextResponse.json(data);
}
