import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { StandingsTable } from "@/components/standings-table";
import { getStandingsForCategory } from "@/lib/content";
import {
  isTournamentCategorySlug,
  resolveYearLabel,
  standingsConfig,
  tournamentCategories,
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
  const groupsByConfig =
    standingsConfig[categoria].find((item) => item.label === yearLabel)?.groups ??
    Object.keys(yearStandings);
  const groups = Array.from(
    new Set([...groupsByConfig, ...Object.keys(yearStandings)]),
  ).sort();
  const hasRows = groups.some((group) => (yearStandings[group] ?? []).length > 0);

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title={`Categoría ${yearLabel}`}
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
                rows={yearStandings[group] ?? []}
              />
            ))}
          </div>
        )}
      </ContentSection>
    </PageBackground>
  );
}
