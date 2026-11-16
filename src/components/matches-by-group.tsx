import { MatchCard } from "@/components/match-card";
import { groupPhaseMatchesByGroup } from "@/lib/match-groups";
import type { Match } from "@/lib/types";

type MatchesByGroupProps = {
  matches: Match[];
  preferredGroups?: string[];
};

export function MatchesByGroup({ matches, preferredGroups = [] }: MatchesByGroupProps) {
  const sections = groupPhaseMatchesByGroup(matches, preferredGroups);

  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-yellow-400/25 p-5 text-sm text-white/60">
        Todavía no hay partidos de grupos.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map(({ group, matches: groupMatches }) => (
        <section
          key={group}
          className="overflow-hidden rounded-2xl border border-yellow-400/20 bg-black/40"
        >
          <header className="flex items-center justify-between gap-3 border-b border-yellow-400/15 bg-yellow-400/10 px-4 py-3 sm:px-5">
            <h3 className="font-display text-base font-bold uppercase tracking-wide text-yellow-300 sm:text-lg">
              Grupo {group}
            </h3>
            <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-xs text-white/70">
              {groupMatches.length}{" "}
              {groupMatches.length === 1 ? "partido" : "partidos"}
            </span>
          </header>

          <div className="grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 md:grid-cols-2 xl:grid-cols-3">
            {groupMatches.map((match) => (
              <MatchCard key={match.id} match={match} compactGroup />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
