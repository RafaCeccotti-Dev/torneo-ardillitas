import Image from "next/image";

import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatKickoff(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function TeamBadge({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-yellow-400/30 bg-black/40">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-lg font-bold text-yellow-400">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="max-w-[8rem] text-sm font-medium text-white">{name}</span>
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  const hasScore =
    match.status === "finalizado" &&
    match.homeScore != null &&
    match.awayScore != null;

  return (
    <article className="rounded-2xl border border-yellow-400/15 bg-black/50 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-yellow-400/90">
        <span>{match.phase === "grupos" ? "Fase de grupos" : match.roundLabel ?? "Cruces"}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5",
            match.status === "finalizado" && "bg-white/10 text-white",
            match.status === "programado" && "bg-yellow-400/20 text-yellow-200",
            match.status === "en_juego" && "bg-amber-500/20 text-amber-200",
          )}
        >
          {match.status === "finalizado"
            ? "Finalizado"
            : match.status === "en_juego"
              ? "En juego"
              : "Programado"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <TeamBadge name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} />
        <div className="text-center">
          {hasScore ? (
            <p className="text-3xl font-black tabular-nums text-white">
              {match.homeScore} - {match.awayScore}
            </p>
          ) : (
            <p className="text-2xl font-bold text-white/80">VS</p>
          )}
          <p className="mt-2 text-sm text-white/80">{formatKickoff(match.kickoffAt)}</p>
          <p className="text-xs text-yellow-400">{match.court}</p>
        </div>
        <TeamBadge name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} />
      </div>
    </article>
  );
}
