import { NextResponse } from "next/server";

import {
  formatBirthDateDisplay,
  MAX_PLAYERS_PER_CATEGORY,
  type StaffRole,
} from "@/lib/accreditation";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";

const SENT_DOC_PREFIX = "accreditation-sent:";

export function serviceOrError() {
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

export function isMissingRelation(
  error: { message?: string; code?: string } | null | undefined,
  table: string,
) {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    msg.includes(table.toLowerCase()) &&
    (msg.includes("schema cache") ||
      msg.includes("does not exist") ||
      msg.includes("pgrst205") ||
      error.code === "42P01" ||
      error.code === "PGRST205")
  );
}

function schemaMissingResponse(table: string) {
  return NextResponse.json(
    {
      error: `Falta la tabla ${table} en Supabase. Hay que ejecutar supabase/accreditation.sql.`,
    },
    { status: 503 },
  );
}

export function publicLogoUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  path: string | null | undefined,
) {
  if (!path) return null;
  return supabase.storage.from("escudos").getPublicUrl(path).data.publicUrl as string;
}

export async function getPortalByToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  token: string,
) {
  const { data: portal, error } = await supabase
    .from("accreditation_portals")
    .select("id, token, name, logo_path")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error, "accreditation_portals")) {
      return { error: schemaMissingResponse("accreditation_portals") };
    }
    return {
      error: NextResponse.json(
        { error: "No pudimos conectar con el sistema. Esperá unos segundos y reintentá." },
        { status: 503 },
      ),
    };
  }

  if (!portal) return { portal: null };
  return { portal };
}

export async function assertTeamInPortal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  token: string,
  teamId: string,
) {
  const found = await getPortalByToken(supabase, token);
  if ("error" in found && found.error) return { ok: false as const, error: found.error };
  if (!found.portal) {
    return {
      ok: false as const,
      error: NextResponse.json({ error: "Link inválido o vencido" }, { status: 404 }),
    };
  }

  const { data: team, error } = await supabase
    .from("teams")
    .select("id, name, category, year_label, group_name")
    .eq("id", teamId)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      error: NextResponse.json(
        { error: "No pudimos conectar con el sistema. Esperá unos segundos y reintentá." },
        { status: 503 },
      ),
    };
  }

  if (!team || team.name !== found.portal.name) {
    return {
      ok: false as const,
      error: NextResponse.json({ error: "Categoría no autorizada en este link" }, { status: 403 }),
    };
  }

  return { ok: true as const, portal: found.portal, team };
}

export async function getSentMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  teamIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!teamIds.length) return map;

  const wanted = new Set(teamIds);
  const { data, error } = await supabase
    .from("accreditation_submissions")
    .select("team_id, sent_at");

  if (!error && data) {
    for (const row of data as { team_id: string; sent_at: string }[]) {
      if (row.sent_at && wanted.has(row.team_id)) map.set(row.team_id, row.sent_at);
    }
    return map;
  }

  const { data: docs } = await supabase
    .from("site_documents")
    .select("key, updated_at")
    .like("key", `${SENT_DOC_PREFIX}%`);

  for (const row of (docs ?? []) as { key: string; updated_at: string }[]) {
    const id = String(row.key).slice(SENT_DOC_PREFIX.length);
    if (wanted.has(id)) map.set(id, row.updated_at);
  }
  return map;
}

export async function getSentAt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  teamId: string,
) {
  const map = await getSentMap(supabase, [teamId]);
  return map.get(teamId) ?? null;
}

export async function assertCategoryEditable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  teamId: string,
) {
  const sentAt = await getSentAt(supabase, teamId);
  if (!sentAt) return null;
  return NextResponse.json(
    {
      error:
        "Esta categoría ya mandó la acreditación completa al correo del coordinador. No se puede borrar ni agregar jugadores. Si hay un error, escribinle al coordinador.",
    },
    { status: 409 },
  );
}

export async function markCategorySent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  teamId: string,
  sentTo: string,
  playerCount: number,
  staffCount: number,
) {
  const sentAt = new Date().toISOString();
  const { error } = await supabase.from("accreditation_submissions").upsert({
    team_id: teamId,
    sent_at: sentAt,
    sent_to: sentTo,
    player_count: playerCount,
    staff_count: staffCount,
  });
  if (!error) return sentAt;

  const { error: docError } = await supabase.from("site_documents").upsert({
    key: `${SENT_DOC_PREFIX}${teamId}`,
    storage_path: sentTo,
    updated_at: sentAt,
  });
  if (docError) {
    throw new Error(
      "El mail salió, pero no se pudo guardar el cierre de la categoría. Avisá al admin antes de volver a tocar el plantel.",
    );
  }
  return sentAt;
}

export function playerWriteErrorMessage(error: {
  message?: string;
  details?: string;
  code?: string;
}) {
  const details = `${error.message ?? ""} ${error.details ?? ""}`;
  if (/dni/i.test(details)) {
    return "Ese DNI ya está cargado. Los jugadores no se pueden repetir en otra categoría.";
  }
  if (/jersey_number/i.test(details)) {
    return "Ese número de camiseta ya está usado en esta categoría";
  }
  return error.message || "No se pudo guardar el jugador";
}

export function categoryLabelFromTeam(team: {
  year_label?: string;
  yearLabel?: string;
  category: string;
  group_name?: string;
  groupName?: string;
}) {
  const year = team.yearLabel ?? team.year_label ?? "";
  const gender = team.category === "femenino" ? "Femenino" : "Masculino";
  const group = team.groupName ?? team.group_name;
  return `${year} · ${gender}${group ? ` · Grupo ${group}` : ""}`;
}

export async function loadAccreditationPayload(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  token: string,
) {
  const found = await getPortalByToken(supabase, token);
  if ("error" in found && found.error) return { error: found.error };
  if (!found.portal) {
    return {
      error: NextResponse.json({ error: "Link inválido o vencido" }, { status: 404 }),
    };
  }
  const portal = found.portal;

  const { data: teamsRaw, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, category, year_label, group_name, logo_path")
    .eq("name", portal.name)
    .order("category", { ascending: true })
    .order("year_label", { ascending: true })
    .order("group_name", { ascending: true });

  if (teamsError) {
    return {
      error: NextResponse.json(
        { error: "No pudimos cargar las categorías de este club. Reintentá." },
        { status: 503 },
      ),
    };
  }

  const teams = teamsRaw ?? [];
  const teamIds = teams.map((t: { id: string }) => t.id);
  const sentMap = await getSentMap(supabase, teamIds);

  const playerChunks = teamIds.length
    ? await Promise.all(
        teamIds.map((id: string) =>
          supabase
            .from("accreditation_players")
            .select("id, team_id, first_name, last_name, dni, birth_date, jersey_number")
            .eq("team_id", id),
        ),
      )
    : [];

  const playerError = playerChunks.find(
    (chunk: { error?: { message?: string; code?: string } | null }) => chunk.error,
  )?.error;
  if (playerError && isMissingRelation(playerError, "accreditation_players")) {
    return { error: schemaMissingResponse("accreditation_players") };
  }

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

  const staffError = staffChunks.find(
    (chunk: { error?: { message?: string; code?: string } | null }) => chunk.error,
  )?.error;
  if (staffError && isMissingRelation(staffError, "accreditation_staff")) {
    return { error: schemaMissingResponse("accreditation_staff") };
  }

  const players = playerChunks.flatMap(
    (chunk: { data: unknown[] | null }) => chunk.data ?? [],
  );
  const staff = staffChunks.flatMap(
    (chunk: {
      data: Array<{
        id: string;
        team_id: string;
        role: StaffRole;
        first_name: string;
        last_name: string;
        dni: string;
        phone: string;
      }> | null;
    }) => chunk.data ?? [],
  );

  const countByTeam = new Map<string, number>();
  for (const player of players as { team_id: string }[]) {
    countByTeam.set(player.team_id, (countByTeam.get(player.team_id) ?? 0) + 1);
  }

  return {
    data: {
      portal: {
        id: portal.id,
        name: portal.name,
        logoUrl: publicLogoUrl(
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
          logoUrl: publicLogoUrl(supabase, team.logo_path),
          playerCount: countByTeam.get(team.id) ?? 0,
          sentAt: sentMap.get(team.id) ?? null,
        }),
      ),
      players: (players as Array<{
        id: string;
        team_id: string;
        first_name: string;
        last_name: string;
        dni: string;
        birth_date: string;
        jersey_number: number;
      }>).map((player) => ({
        id: player.id,
        teamId: player.team_id,
        firstName: player.first_name,
        lastName: player.last_name,
        dni: player.dni,
        birthDate: player.birth_date,
        birthDateDisplay: formatBirthDateDisplay(player.birth_date),
        jerseyNumber: player.jersey_number,
        dniPhotoUrl: null,
      })),
      staff: staff.map((row) => ({
        id: row.id,
        teamId: row.team_id,
        role: row.role,
        firstName: row.first_name,
        lastName: row.last_name,
        dni: row.dni,
        phone: row.phone,
      })),
      maxPlayers: MAX_PLAYERS_PER_CATEGORY,
    },
  };
}

/** El coordinador crea cada link. Solo se deja el que ya existía antes del alta masiva. */
const KEEP_PORTAL_NAME = 'Central Ceres "Amarillo"';

export async function deleteAutoCreatedPortals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
) {
  const { data: portals, error } = await supabase
    .from("accreditation_portals")
    .select("id, name");

  if (error) {
    if (isMissingRelation(error, "accreditation_portals")) {
      return { error: "Falta ejecutar supabase/accreditation.sql en Supabase." };
    }
    return { error: error.message };
  }

  const toDelete = (portals ?? []).filter(
    (portal: { name: string }) => portal.name !== KEEP_PORTAL_NAME,
  );

  if (toDelete.length) {
    const { error: deleteError } = await supabase
      .from("accreditation_portals")
      .delete()
      .neq("name", KEEP_PORTAL_NAME);
    if (deleteError) return { error: deleteError.message };
  }

  return {
    deleted: toDelete.map((portal: { name: string }) => portal.name),
    kept: KEEP_PORTAL_NAME,
  };
}
