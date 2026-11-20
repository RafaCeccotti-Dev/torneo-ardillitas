const PEN_RE = /\s*[·•]\s*pen(?:ales)?\.?\s*(\d+)\s*[-–]\s*(\d+)\s*$/i;

export function splitRoundAndPens(label: string | null | undefined) {
  const raw = String(label ?? "").trim();
  const match = raw.match(PEN_RE);
  if (!match) {
    return {
      roundLabel: raw || undefined,
      homePenalties: null as number | null,
      awayPenalties: null as number | null,
    };
  }
  return {
    roundLabel: raw.replace(PEN_RE, "").trim() || undefined,
    homePenalties: Number(match[1]),
    awayPenalties: Number(match[2]),
  };
}

export function joinRoundAndPens(
  roundLabel: string | null | undefined,
  homePenalties: number | null,
  awayPenalties: number | null,
) {
  const base = splitRoundAndPens(roundLabel).roundLabel ?? "";
  if (homePenalties == null || awayPenalties == null) return base || null;
  return `${base} · pen. ${homePenalties}-${awayPenalties}`;
}

function asInt(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

export function resolveKnockoutPenalties(input: {
  phase: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: unknown;
  awayPenalties: unknown;
}): { ok: true; homePenalties: number | null; awayPenalties: number | null } | { ok: false; error: string } {
  if (input.phase !== "cruces") {
    return { ok: true, homePenalties: null, awayPenalties: null };
  }
  if (input.homeScore == null || input.awayScore == null || input.homeScore !== input.awayScore) {
    return { ok: true, homePenalties: null, awayPenalties: null };
  }

  const homePenalties = asInt(input.homePenalties);
  const awayPenalties = asInt(input.awayPenalties);
  if (homePenalties == null || awayPenalties == null) {
    return {
      ok: false,
      error: "Empate en cruces: cargá el resultado de los penales para definir quién pasa.",
    };
  }
  if (homePenalties === awayPenalties) {
    return {
      ok: false,
      error: "Los penales no pueden quedar empatados. Tiene que haber un ganador.",
    };
  }
  return { ok: true, homePenalties, awayPenalties };
}
