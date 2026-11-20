import { NextResponse } from "next/server";

import { isTeamSubmitted, markTeamSubmitted } from "@/lib/accreditation-access";
import {
  categoryLabel,
  MAX_PLAYERS_PER_CATEGORY,
  MAX_STAFF_PER_CATEGORY,
} from "@/lib/accreditation";
import { assertAccreditationPdf } from "@/lib/accreditation-pdf-assert";
import { buildAccreditationPdf, normalizeRosterPlayers, parseJerseyNumber } from "@/lib/accreditation-pdf";
import { buildRosterEmailText } from "@/lib/roster-email-text";
import { COORDINATOR_EMAIL, sendPdfEmail } from "@/lib/send-email";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const body = (await request.json().catch(() => ({}))) as { teamId?: string };
  const teamId = String(body.teamId ?? "").trim();
  if (!teamId) {
    return NextResponse.json({ error: "Falta la categoría" }, { status: 400 });
  }

  const { data: portal, error: portalError } = await supabase
    .from("accreditation_portals")
    .select("id, name, token")
    .eq("token", params.token)
    .maybeSingle();

  if (portalError) {
    return NextResponse.json(
      { error: "No pudimos conectar con el sistema. Esperá unos segundos y reintentá." },
      { status: 503 },
    );
  }

  if (!portal) {
    return NextResponse.json({ error: "Link inválido o vencido" }, { status: 404 });
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, category, year_label, group_name")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError) {
    return NextResponse.json(
      { error: "No pudimos conectar con el sistema. Esperá unos segundos y reintentá." },
      { status: 503 },
    );
  }

  if (!team || team.name !== portal.name) {
    return NextResponse.json({ error: "Categoría no autorizada en este link" }, { status: 403 });
  }

  if (await isTeamSubmitted(supabase, teamId)) {
    return NextResponse.json(
      {
        error:
          "Esta categoría ya fue enviada al coordinador. No se puede volver a enviar ni modificar.",
      },
      { status: 409 },
    );
  }

  const [{ data: players, error: playersError }, { data: staff, error: staffError }] =
    await Promise.all([
      supabase
        .from("accreditation_players")
        .select("first_name, last_name, dni, birth_date, jersey_number")
        .eq("team_id", teamId),
      supabase
        .from("accreditation_staff")
        .select("role, first_name, last_name, dni, phone")
        .eq("team_id", teamId),
    ]);

  if (playersError || staffError) {
    return NextResponse.json(
      {
        error:
          "No se pudo leer el plantel. Esperá unos segundos y reintentá.",
      },
      { status: 503 },
    );
  }

  if (!players?.length) {
    return NextResponse.json(
      { error: "Cargá al menos un jugador antes de enviar la inscripción" },
      { status: 400 },
    );
  }

  if (team.category !== "femenino" && !String(team.group_name ?? "").trim()) {
    return NextResponse.json(
      { error: "Esta categoría no tiene grupo. Avisá a la organización antes de enviar." },
      { status: 400 },
    );
  }

  let rosterPlayers;
  try {
    rosterPlayers = normalizeRosterPlayers(
      players.slice(0, MAX_PLAYERS_PER_CATEGORY).map((p) => ({
        firstName: p.first_name,
        lastName: p.last_name,
        dni: p.dni,
        birthDate: p.birth_date,
        jerseyNumber: parseJerseyNumber(p.jersey_number),
      })),
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "El plantel está incompleto" },
      { status: 400 },
    );
  }

  const label = categoryLabel(team);
  const rosterStaff = (staff ?? []).slice(0, MAX_STAFF_PER_CATEGORY).map((s) => ({
    role: s.role,
    firstName: s.first_name,
    lastName: s.last_name,
    dni: s.dni ?? "",
    phone: s.phone ?? "",
  }));

  const emailText = buildRosterEmailText({
    clubName: portal.name,
    categoryLabel: label,
    players: rosterPlayers,
    staff: rosterStaff,
  });

  try {
    const pdfBytes = await buildAccreditationPdf({
      clubName: portal.name,
      categoryLabel: label,
      players: rosterPlayers,
      staff: rosterStaff,
    });
    try {
      await assertAccreditationPdf(pdfBytes, {
        clubName: portal.name,
        categoryLabel: label,
        players: rosterPlayers,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (!/fake worker|pdf\.worker/i.test(msg)) throw err;
    }

    const filename = `plantel-${portal.name}-${team.year_label}.pdf`
      .replace(/\s+/g, "-")
      .toLowerCase();
    const subject = `Inscripción plantel · ${portal.name} · ${label}`;

    const result = await sendPdfEmail({
      to: COORDINATOR_EMAIL,
      subject,
      text: emailText,
      pdfBytes,
      filename,
    });

    if (!result) {
      return NextResponse.json(
        {
          error:
            "No se pudo enviar el mail al coordinador. El plantel NO se cerró. Reintentá en un minuto.",
        },
        { status: 503 },
      );
    }

    const lock = await markTeamSubmitted(supabase, {
      teamId,
      portalId: portal.id,
      playerCount: rosterPlayers.length,
      staffCount: rosterStaff.length,
    });

    if (!lock.ok) {
      return NextResponse.json(
        {
          error:
            "El PDF ya salió al mail, pero no se pudo cerrar la categoría: " + lock.error,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      locked: true,
      to: COORDINATOR_EMAIL,
      players: rosterPlayers.length,
      staff: rosterStaff.length,
      provider: result.provider,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo enviar el PDF" },
      { status: 500 },
    );
  }
}
