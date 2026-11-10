import { NextResponse } from "next/server";

type ServiceClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  storage: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (bucket: string) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createBucket?: (id: string, options?: Record<string, unknown>) => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getBucket?: (id: string) => Promise<any>;
  };
};

const LOCK_BUCKET = "accreditation-locks";

export async function getPortalByToken(supabase: ServiceClient, token: string) {
  const { data: portal } = await supabase
    .from("accreditation_portals")
    .select("id, name")
    .eq("token", token)
    .maybeSingle();
  return portal as { id: string; name: string } | null;
}

export async function assertTeamInPortal(
  supabase: ServiceClient,
  token: string,
  teamId: string,
) {
  const portal = await getPortalByToken(supabase, token);
  if (!portal) return { ok: false as const, portal: null };
  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .maybeSingle();
  if (!team || team.name !== portal.name) {
    return { ok: false as const, portal };
  }
  return { ok: true as const, portal };
}

async function ensureLockBucket(supabase: ServiceClient) {
  const { data: bucket } = await supabase.storage.getBucket?.(LOCK_BUCKET);
  if (bucket) return;
  await supabase.storage.createBucket?.(LOCK_BUCKET, {
    public: false,
    fileSizeLimit: 50_000,
  });
}

function lockPath(teamId: string) {
  return `${teamId}.json`;
}

export async function isTeamSubmitted(supabase: ServiceClient, teamId: string) {
  // Preferimos la tabla si existe; si no, Storage (sin SQL manual).
  const { data, error } = await supabase
    .from("accreditation_submissions")
    .select("team_id, submitted_at")
    .eq("team_id", teamId)
    .maybeSingle();

  if (!error && data?.team_id) return true;
  if (error && !String(error.message || "").includes("accreditation_submissions")) {
    // error inesperado de red/auth: no bloqueamos de más
  }

  const { data: file, error: storageError } = await supabase.storage
    .from(LOCK_BUCKET)
    .download(lockPath(teamId));

  if (storageError) return false;
  return Boolean(file);
}

export async function listSubmittedTeamIds(
  supabase: ServiceClient,
  teamIds: string[],
) {
  const submitted = new Map<string, string>();
  if (!teamIds.length) return submitted;

  const { data, error } = await supabase
    .from("accreditation_submissions")
    .select("team_id, submitted_at")
    .in("team_id", teamIds);

  if (!error) {
    for (const row of data ?? []) {
      submitted.set(row.team_id, row.submitted_at);
    }
    return submitted;
  }

  await Promise.all(
    teamIds.map(async (teamId) => {
      const { data: file } = await supabase.storage
        .from(LOCK_BUCKET)
        .download(lockPath(teamId));
      if (file) submitted.set(teamId, new Date().toISOString());
    }),
  );

  return submitted;
}

export async function markTeamSubmitted(
  supabase: ServiceClient,
  input: {
    teamId: string;
    portalId: string;
    playerCount: number;
    staffCount: number;
  },
) {
  const payload = {
    team_id: input.teamId,
    portal_id: input.portalId,
    submitted_at: new Date().toISOString(),
    player_count: input.playerCount,
    staff_count: input.staffCount,
  };

  const { error } = await supabase
    .from("accreditation_submissions")
    .upsert(payload, { onConflict: "team_id" });

  if (!error) return { ok: true as const, via: "table" as const };

  // Fallback sin SQL: archivo en Storage.
  await ensureLockBucket(supabase);
  const body = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const { error: uploadError } = await supabase.storage
    .from(LOCK_BUCKET)
    .upload(lockPath(input.teamId), body, {
      upsert: true,
      contentType: "application/json",
    });

  if (uploadError) {
    return { ok: false as const, error: uploadError.message };
  }
  return { ok: true as const, via: "storage" as const };
}

export function categoryLockedResponse() {
  return NextResponse.json(
    {
      error:
        "Esta categoría ya fue enviada al coordinador. No se puede modificar. Si hay un error, escribinos por WhatsApp.",
    },
    { status: 409 },
  );
}

export async function assertTeamEditable(
  supabase: ServiceClient,
  token: string,
  teamId: string,
) {
  const access = await assertTeamInPortal(supabase, token, teamId);
  if (!access.ok || !access.portal) {
    return {
      error: NextResponse.json({ error: "Equipo no autorizado en este link" }, { status: 403 }),
    };
  }
  if (await isTeamSubmitted(supabase, teamId)) {
    return { error: categoryLockedResponse() };
  }
  return { portal: access.portal };
}
