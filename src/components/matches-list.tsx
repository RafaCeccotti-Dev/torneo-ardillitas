import { MatchCard } from "@/components/match-card";
import type { Match } from "@/lib/types";

export function MatchesList({
  matches,
  emptyLabel = "Todavía no hay partidos cargados.",
}: {
  matches: Match[];
  emptyLabel?: string;
}) {
  const grupos = matches.filter((match) => match.phase === "grupos");
  const cruces = matches.filter((match) => match.phase === "cruces");

  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-yellow-400/25 p-6 text-white/60">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {grupos.length > 0 ? (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Fase de grupos</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {grupos.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ) : null}
      {cruces.length > 0 ? (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Cruces</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {cruces.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
