import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { StandingsTable } from "@/components/standings-table";
import { getStandingsForCategory } from "@/lib/content";
import {
  isTournamentCategorySlug,
  standingsConfig,
  tournamentCategories,
} from "@/lib/tournament-categories";

export const revalidate = 60;

type TablaCategoriaPageProps = {
  params: { categoria: string };
};

export function generateStaticParams() {
  return tournamentCategories.map((category) => ({ categoria: category.slug }));
}

export default async function TablaCategoriaPage({ params }: TablaCategoriaPageProps) {
  if (!isTournamentCategorySlug(params.categoria)) {
    notFound();
  }

  const categoria = params.categoria;
  const category = tournamentCategories.find((item) => item.slug === categoria)!;
  const standings = await getStandingsForCategory(categoria);
  const yearLabels = Object.keys(standings);
  const hasTeams = yearLabels.length > 0;

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title={category.title}
        description="Posiciones por categoría de nacimiento y grupo."
      >
        <Link
          href="/tabla"
          className="mb-8 inline-block text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          ← Elegir masculino o femenino
        </Link>

        {!hasTeams ? (
          <div className="rounded-2xl border border-dashed border-yellow-400/30 bg-black/40 p-8 text-center sm:p-12">
            <p className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400">
              Tablas próximamente
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/75">
              Las tablas de posiciones se cargarán antes de comenzar el torneo, cuando
              estén definidos los grupos y los equipos.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {yearLabels.map((yearLabel) => {
              const groupsByConfig =
                standingsConfig[categoria].find((item) => item.label === yearLabel)?.groups ??
                Object.keys(standings[yearLabel]);
              const groups = Array.from(
                new Set([...groupsByConfig, ...Object.keys(standings[yearLabel])]),
              ).sort();

              return (
                <section key={yearLabel} className="space-y-4">
                  <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-yellow-400">
                    Categoría {yearLabel}
                  </h2>
                  <div className="grid gap-4 lg:grid-cols-1">
                    {groups.map((group) => (
                      <StandingsTable
                        key={`${yearLabel}-${group}`}
                        group={group}
                        rows={standings[yearLabel][group] ?? []}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </ContentSection>
    </PageBackground>
  );
}
