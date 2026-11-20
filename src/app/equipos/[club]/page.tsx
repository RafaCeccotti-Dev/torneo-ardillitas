import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { MatchesList } from "@/components/matches-list";
import { PageBackground } from "@/components/page-background";
import { StandingsTable } from "@/components/standings-table";
import { TeamCrest } from "@/components/team-crest";
import { clubDisplayName, teamsForClub } from "@/lib/club";
import { getMatches, getTeams } from "@/lib/content";
import { computeStandingsByGroup, groupHeading } from "@/lib/standings";
import type { Match, Team } from "@/lib/types";
import {
  standingsConfig,
  tournamentCategories,
  type TournamentCategorySlug,
} from "@/lib/tournament-categories";

export const revalidate = 60;
export const dynamicParams = true;

type EquipoPageProps = {
  params: { club: string };
};

const categoryOrder: Record<string, number> = { masculino: 0, femenino: 1 };

function sortClubTeams(teams: Team[]) {
  return [...teams].sort((a, b) => {
    const catDiff = (categoryOrder[a.category ?? ""] ?? 9) - (categoryOrder[b.category ?? ""] ?? 9);
    if (catDiff !== 0) return catDiff;

    const yearsA = a.category ? standingsConfig[a.category].map((item) => item.label) : [];
    const yearsB = b.category ? standingsConfig[b.category].map((item) => item.label) : [];
    const indexA = yearsA.indexOf(a.yearLabel ?? "");
    const indexB = yearsB.indexOf(b.yearLabel ?? "");
    if (indexA !== -1 && indexB !== -1 && indexA !== indexB) return indexA - indexB;
    if ((a.yearLabel ?? "") !== (b.yearLabel ?? "")) {
      return (a.yearLabel ?? "").localeCompare(b.yearLabel ?? "");
    }
    return a.name.localeCompare(b.name);
  });
}

function teamMatches(matches: Match[], teamId: string) {
  return matches.filter((match) => match.homeTeam.id === teamId || match.awayTeam.id === teamId);
}

function categoryTitle(categoria?: TournamentCategorySlug) {
  return tournamentCategories.find((item) => item.slug === categoria)?.title ?? "Categoría";
}

export default async function EquipoPage({ params }: EquipoPageProps) {
  const slug = decodeURIComponent(params.club);
  const [teams, matches] = await Promise.all([getTeams(), getMatches()]);
  const clubTeams = sortClubTeams(teamsForClub(teams, slug));

  if (clubTeams.length === 0) {
    notFound();
  }

  const title = clubDisplayName(clubTeams[0].name);
  const logoUrl = clubTeams.find((team) => team.logoUrl)?.logoUrl ?? null;
  const hasMultipleTeams = clubTeams.length > 1;

  return (
    <PageBackground imageKey="partidos" className="min-h-[40vh]">
      <ContentSection
        title={title}
        description={
          hasMultipleTeams
            ? `${clubTeams.length} equipos de este club en el torneo, separados por categoría.`
            : "Partidos, tabla y cruces de este equipo."
        }
      >
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <TeamCrest src={logoUrl} name={title} size="club" />
          <Link href="/partidos" className="text-sm font-medium text-yellow-400 hover:text-yellow-300">
            ← Volver a partidos
          </Link>
        </div>

        <div className="space-y-12">
          {clubTeams.map((team) => {
            const yearTeams = teams.filter(
              (item) =>
                item.category === team.category &&
                item.yearLabel === team.yearLabel &&
                item.group,
            );
            const yearGroupMatches = matches.filter(
              (match) =>
                match.category === team.category &&
                match.yearLabel === team.yearLabel &&
                match.phase === "grupos",
            );
            const standings = computeStandingsByGroup(yearTeams, yearGroupMatches);
            const groupRows = team.group ? (standings[team.group] ?? []) : [];
            const position = groupRows.findIndex((row) => row.team.id === team.id) + 1;
            const ownMatches = teamMatches(matches, team.id);
            const heading = `${categoryTitle(team.category)} · ${team.yearLabel ?? ""}`.trim();

            return (
              <section
                key={team.id}
                className="space-y-6 rounded-3xl border border-yellow-400/15 bg-black/30 p-5 sm:p-6"
              >
                <div>
                  <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-yellow-400">
                    {heading}
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    {team.name}
                    {team.group ? ` · ${groupHeading(team.group)}` : ""}
                    {position > 0 ? ` · ${position}°` : ""}
                  </p>
                </div>

                {groupRows.length > 0 ? (
                  <StandingsTable
                    group={team.group}
                    rows={groupRows}
                    highlightTeamId={team.id}
                  />
                ) : null}

                <MatchesList
                  matches={ownMatches}
                  emptyLabel="Este equipo todavía no tiene partidos cargados."
                />
              </section>
            );
          })}
        </div>
      </ContentSection>
    </PageBackground>
  );
}
