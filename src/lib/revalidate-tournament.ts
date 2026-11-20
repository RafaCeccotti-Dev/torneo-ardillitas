import { revalidatePath } from "next/cache";

export function revalidateTournamentPages() {
  revalidatePath("/");
  revalidatePath("/partidos");
  revalidatePath("/partidos", "layout");
  revalidatePath("/partidos/masculino");
  revalidatePath("/partidos/femenino");
  revalidatePath("/partidos/femenino/2011");
  revalidatePath("/partidos/femenino/2013");
  revalidatePath("/tabla/femenino");
  revalidatePath("/tabla/femenino/2011");
  revalidatePath("/tabla/femenino/2013");
  revalidatePath("/equipos", "layout");
  revalidatePath("/tabla", "layout");
}

export function resolveMatchStatus(
  status: string | undefined,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): "programado" | "en_juego" | "finalizado" {
  if (homeScore != null && awayScore != null) {
    return "finalizado";
  }
  if (status === "en_juego" || status === "finalizado") {
    return status;
  }
  return "programado";
}
