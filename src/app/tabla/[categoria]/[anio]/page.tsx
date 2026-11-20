import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { StandingsTable } from "@/components/standings-table";
import { getStandingsForCategory } from "@/lib/content";
import {
  computeGeneralStandings,
  crucesQualificationNotes,
  isGeneralTable,
  sortGroupNames,
} from "@/lib/standings";
import { femaleFormatNotes } from "@/data/official-fixtures-femenino";
import {
  isTournamentCategorySlug,
  resolveYearLabel,
  standingsConfig,
  tournamentCategories,
  yearConfig,
  yearDisplayName,
  yearLabelToSlug,
} from "@/lib/tournament-categories";

export const revalidate = 60;

type TablaAnioPageProps = {
  params: { categoria: string; anio: string };
};

export function generateStaticParams() {
  return tournamentCategories.flatMap((category) =>
    standingsConfig[category.slug].map((year) => ({
      categoria: category.slug,
      anio: yearLabelToSlug(year.label),
    })),
  );
}

export default async function TablaAnioPage({ params }: TablaAnioPageProps) {
  if (!isTournamentCategorySlug(params.categoria)) {
    notFound();
  }

  const categoria = params.categoria;
  const category = tournamentCategories.find((item) => item.slug === categoria)!;
  const standings = await getStandingsForCategory(categoria);
  const yearLabel = resolveYearLabel(params.anio, categoria, Object.keys(standings));
  if (!yearLabel) {
    notFound();
  }

  const yearStandings = standings[yearLabel] ?? {};
  const config = yearConfig(categoria, yearLabel);
  const groupsByConfig = config?.groups ?? Object.keys(yearStandings);
  const singleTable = Boolean(config?.singleTable);
  const displayTitle = yearDisplayName(categoria, yearLabel);
  const formatNote =
    categoria === "femenino" ? femaleFormatNotes[yearLabel] : undefined;
  const groups = sortGroupNames(
    Array.from(new Set([...groupsByConfig, ...Object.keys(yearStandings)])).filter(
      (group) => !isGeneralTable(group),
    ),
  );
  const generalRows = computeGeneralStandings(yearStandings);
  const hasRows = groups.some((group) => (yearStandings[group] ?? []).length > 0);

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title={`Categoría ${displayTitle}`}
        description={`${category.title} · tabla de posiciones.`}
      >
        <Link
          href={`/tabla/${categoria}`}
          className="mb-6 inline-block text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          ← Todas las categorías
        </Link>

        {!hasRows ? (
          <div className="rounded-2xl border border-dashed border-yellow-400/30 bg-black/40 p-8 text-center sm:p-12">
            <p className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400">
              Tabla próximamente
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/75">
              Todavía no hay posiciones cargadas para la categoría {yearLabel}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-1">
            {groups.map((group) => (
              <StandingsTable
                key={`${yearLabel}-${group}`}
                group={group}
                heading={singleTable || groups.length === 1 ? "Tabla general" : undefined}
                rows={yearStandings[group] ?? []}
                note={
                  groups.length === 1
                    ? formatNote ??
                      crucesQualificationNotes[`${categoria}:${yearLabel}`] ??
                      crucesQualificationNotes[yearLabel]
                    : undefined
                }
                showRank={singleTable || groups.length === 1}
              />
            ))}
            {generalRows.length > 1 && groups.length > 1 ? (
              <StandingsTable
                key={`${yearLabel}-general`}
                group="PEND"
                heading="Tabla general"
                note={
                  crucesQualificationNotes[`${categoria}:${yearLabel}`] ??
                  crucesQualificationNotes[yearLabel] ??
                  "Todas las posiciones de la categoría, para ver terceros y cómo entran a los cruces."
                }
                rows={generalRows}
                showRank
                showGroup
              />
            ) : null}
          </div>
        )}
      </ContentSection>
    </PageBackground>
  );
}
