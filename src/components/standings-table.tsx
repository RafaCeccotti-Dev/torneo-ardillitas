import Link from "next/link";

import { TeamCrest } from "@/components/team-crest";
import { clubSlug } from "@/lib/club";
import { groupHeading } from "@/lib/standings";
import type { StandingRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StandingsTable({
  group,
  rows,
  highlightTeamId,
  heading,
  note,
  showRank = false,
  showGroup = false,
}: {
  group: string;
  rows: StandingRow[];
  highlightTeamId?: string;
  heading?: string;
  note?: string;
  showRank?: boolean;
  showGroup?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-yellow-400/15 bg-black/50 backdrop-blur-sm">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-white">{heading ?? groupHeading(group)}</h3>
        {note ? <p className="mt-1.5 text-sm leading-relaxed text-white/65">{note}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-white/90">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/60">
            <tr>
              {showRank ? <th className="px-3 py-2 text-center">Pos</th> : null}
              <th className="px-4 py-2">Equipo</th>
              <th className="px-2 py-2 text-center">PJ</th>
              <th className="px-2 py-2 text-center">PG</th>
              <th className="px-2 py-2 text-center">PE</th>
              <th className="px-2 py-2 text-center">PP</th>
              <th className="px-2 py-2 text-center">GF</th>
              <th className="px-2 py-2 text-center">GC</th>
              <th className="px-2 py-2 text-center">DG</th>
              <th className="px-4 py-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, index) => {
                const highlighted = row.team.id === highlightTeamId;
                return (
                  <tr
                    key={row.team.id}
                    className={cn(
                      highlighted ? "bg-yellow-400/15" : index % 2 === 0 ? "bg-transparent" : "bg-white/5",
                    )}
                  >
                    {showRank ? (
                      <td className="px-3 py-3 text-center text-sm font-bold tabular-nums text-yellow-400">
                        {index + 1}°
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <Link
                        href={`/equipos/${clubSlug(row.team)}`}
                        className="flex items-center gap-3 hover:text-yellow-400"
                      >
                        <TeamCrest src={row.team.logoUrl} name={row.team.name} size="table" />
                        <span className="min-w-0">
                          <span className={cn("font-medium", highlighted ? "text-yellow-300" : "text-white")}>
                            {row.team.name}
                          </span>
                          {showGroup && row.team.group ? (
                            <span className="ml-2 text-xs font-medium uppercase tracking-wide text-white/45">
                              Grupo {row.team.group}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-center tabular-nums">{row.played}</td>
                    <td className="px-2 py-3 text-center tabular-nums">{row.won}</td>
                    <td className="px-2 py-3 text-center tabular-nums">{row.drawn}</td>
                    <td className="px-2 py-3 text-center tabular-nums">{row.lost}</td>
                    <td className="px-2 py-3 text-center tabular-nums">{row.goalsFor}</td>
                    <td className="px-2 py-3 text-center tabular-nums">{row.goalsAgainst}</td>
                    <td className="px-2 py-3 text-center tabular-nums">
                      {row.goalsFor - row.goalsAgainst > 0
                        ? `+${row.goalsFor - row.goalsAgainst}`
                        : row.goalsFor - row.goalsAgainst}
                    </td>
                    <td className="px-4 py-3 text-center text-base font-bold tabular-nums text-yellow-400">
                      {row.points}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={showRank ? 10 : 9} className="px-4 py-6 text-center text-sm text-white/55">
                  Sin equipos cargados en este grupo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
