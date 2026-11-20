import Link from "next/link";

import { TeamCrest } from "@/components/team-crest";
import { clubSlug } from "@/lib/club";
import { formatKickoff } from "@/lib/kickoff";
import { isPlaceholderTeamName } from "@/lib/knockout";
import type { Match, Team } from "@/lib/types";
import { cn } from "@/lib/utils";

function TeamBadge({
  team,
  compact,
}: {
  team: Team;
  compact?: boolean;
}) {
  const placeholder = isPlaceholderTeamName(team.name);
  const body = (
    <>
      <TeamCrest src={placeholder ? null : team.logoUrl} name={team.name} size={compact ? "table" : "match"} />
      <span
        className={cn(
          "line-clamp-2 text-xs font-medium leading-snug sm:text-sm",
          placeholder
            ? "max-w-[8.5rem] text-yellow-200 sm:max-w-[10rem]"
            : "max-w-[7.5rem] text-white underline-offset-2 hover:text-yellow-400 hover:underline sm:max-w-[9rem]",
        )}
      >
        {team.name}
      </span>
    </>
  );

  if (placeholder) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center sm:gap-2">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/equipos/${clubSlug(team)}`}
      className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center transition hover:opacity-90 sm:gap-2"
    >
      {body}
    </Link>
  );
}

function statusLabel(status: Match["status"]) {
  if (status === "finalizado") return "Finalizado";
  if (status === "en_juego") return "En juego";
  return "Programado";
}

export function MatchCard({
  match,
  compactGroup = false,
}: {
  match: Match;
  /** Dentro de un bloque "Grupo X": muestra jornada en vez de repetir "Fase de grupos". */
  compactGroup?: boolean;
}) {
  const hasScore =
    match.status === "finalizado" &&
    match.homeScore != null &&
    match.awayScore != null;

  const headerLeft =
    match.phase === "grupos"
      ? compactGroup
        ? match.roundLabel?.replace(/^Grupo\s+[A-Z0-9]+\s*[·•\-]?\s*/i, "") ||
          "Grupos"
        : match.roundLabel ?? "Fase de grupos"
      : match.roundLabel ?? "Cruces";

  return (
    <article className="rounded-2xl border border-yellow-400/15 bg-black/55 p-3 backdrop-blur-sm sm:p-4">
      <div className="mb-2.5 flex items-start justify-between gap-2 text-[10px] uppercase tracking-wide text-yellow-400/90 sm:mb-3 sm:text-xs">
        <span className="min-w-0 leading-snug">{headerLeft}</span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5",
            match.status === "finalizado" && "bg-white/10 text-white",
            match.status === "programado" && "bg-yellow-400/20 text-yellow-200",
            match.status === "en_juego" && "bg-amber-500/20 text-amber-200",
          )}
        >
          {statusLabel(match.status)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <TeamBadge team={match.homeTeam} compact={compactGroup} />
        <div className="shrink-0 px-1 text-center">
          {hasScore ? (
            <>
              <p className="text-2xl font-black tabular-nums text-white sm:text-3xl">
                {match.homeScore}
                <span className="mx-1 text-white/40">-</span>
                {match.awayScore}
              </p>
              {match.homePenalties != null && match.awayPenalties != null ? (
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-yellow-300 sm:text-xs">
                  {match.homePenalties}-{match.awayPenalties} pen.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-xl font-bold text-white/80 sm:text-2xl">VS</p>
          )}
          <p className="mt-1.5 text-[11px] leading-snug text-white/80 sm:mt-2 sm:text-sm">
            {formatKickoff(match.kickoffAt)}
          </p>
          <p className="text-[11px] font-medium text-yellow-400 sm:text-xs">{match.court}</p>
        </div>
        <TeamBadge team={match.awayTeam} compact={compactGroup} />
      </div>
    </article>
  );
}
