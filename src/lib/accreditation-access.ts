import { NextResponse } from "next/server";

type ServiceClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

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

export async function isTeamSubmitted(supabase: ServiceClient, teamId: string) {
  const { data } = await supabase
    .from("accreditation_submissions")
    .select("team_id, submitted_at")
    .eq("team_id", teamId)
    .maybeSingle();
  return Boolean(data?.team_id);
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
