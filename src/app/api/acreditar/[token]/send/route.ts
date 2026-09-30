import { NextResponse } from "next/server";

import { buildAccreditationPdf } from "@/lib/accreditation-pdf";
import { buildRosterEmailText } from "@/lib/roster-email-text";
import { COORDINATOR_EMAIL, sendPdfEmail } from "@/lib/send-email";
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

function categoryLabel(team: {
  year_label: string;
  category: string;
  group_name: string;
}) {
  const gender = team.category === "femenino" ? "Femenino" : "Masculino";
  const group = team.group_name ? ` · Grupo ${team.group_name}` : "";
  return `${team.year_label} · ${gender}${group}`;
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

  const [{ data: players }, { data: staff }] = await Promise.all([
    supabase
      .from("accreditation_players")
      .select("first_name, last_name, dni, birth_date, jersey_number")
      .eq("team_id", teamId)
      .order("jersey_number", { ascending: true }),
    supabase
      .from("accreditation_staff")
      .select("role, first_name, last_name, dni, phone")
      .eq("team_id", teamId),
  ]);

  if (!players?.length) {
    return NextResponse.json(
      { error: "Cargá al menos un jugador antes de enviar la inscripción" },
      { status: 400 },
    );
  }

  const label = categoryLabel(team);
  const rosterPlayers = (players ?? []).map((p) => ({
    firstName: p.first_name,
    lastName: p.last_name,
    dni: p.dni,
    birthDate: p.birth_date,
    jerseyNumber: p.jersey_number,
  }));
  const rosterStaff = (staff ?? []).map((s) => ({
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

  const pdfBytes = await buildAccreditationPdf({
    clubName: portal.name,
    categoryLabel: label,
    players: rosterPlayers,
    staff: rosterStaff,
  });

  const filename = `plantel-${portal.name}-${team.year_label}.pdf`
    .replace(/\s+/g, "-")
    .toLowerCase();
  const subject = `Inscripción plantel · ${portal.name} · ${label}`;

  try {
    const result = await sendPdfEmail({
      to: COORDINATOR_EMAIL,
      subject,
      text: emailText,
      pdfBytes,
      filename,
    });

    if (result) {
      return NextResponse.json({
        ok: true,
        to: COORDINATOR_EMAIL,
        players: players.length,
        staff: staff?.length ?? 0,
        provider: result.provider,
      });
    }

    return NextResponse.json({
      ok: true,
      needsClientSend: true,
      to: COORDINATOR_EMAIL,
      players: players.length,
      staff: staff?.length ?? 0,
      subject,
      text: emailText,
      filename,
      pdfBase64: Buffer.from(pdfBytes).toString("base64"),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo enviar el PDF" },
      { status: 500 },
    );
  }
}
