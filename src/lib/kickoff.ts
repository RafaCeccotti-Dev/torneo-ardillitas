/** Hora del torneo (Ceres, Santa Fe). */
export const TOURNAMENT_TIMEZONE = "America/Argentina/Buenos_Aires";

/** Convierte fecha + hora del formulario a ISO UTC (guardado en DB). */
export function combineKickoff(date: string, time: string): string {
  const normalizedTime = time.slice(0, 5);
  return new Date(`${date}T${normalizedTime}:00-03:00`).toISOString();
}

/** Separa un ISO en campos para inputs date/time en hora Argentina. */
export function splitKickoff(iso: string): { kickoffDate: string; kickoffTime: string } {
  const date = new Date(iso);

  const kickoffDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOURNAMENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const kickoffTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: TOURNAMENT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return { kickoffDate, kickoffTime };
}

/** Formato legible para listados públicos y admin. */
export function formatKickoff(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TOURNAMENT_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
