import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { MatchCard } from "@/components/match-card";
import { MatchesByGroup } from "@/components/matches-by-group";
import { PageBackground } from "@/components/page-background";
import { getMatches } from "@/lib/content";
import {
  isTournamentCategorySlug,
  resolveYearLabel,
  standingsConfig,
  tournamentCategories,
  yearLabelToSlug,
} from "@/lib/tournament-categories";

export const revalidate = 60;

type PartidosAnioPageProps = {
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

export default async function PartidosAnioPage({ params }: PartidosAnioPageProps) {
  if (!isTournamentCategorySlug(params.categoria)) {
    notFound();
  }

  const categoria = params.categoria;
  const category = tournamentCategories.find((item) => item.slug === categoria)!;
  const allMatches = await getMatches({ category: categoria });
  const yearLabel = resolveYearLabel(
    params.anio,
    categoria,
    allMatches.map((m) => m.yearLabel),
  );
  if (!yearLabel) {
    notFound();
  }

  const matches = allMatches.filter((m) => m.yearLabel === yearLabel);
  const grupos = matches.filter((m) => m.phase === "grupos");
  const cruces = matches
    .filter((m) => m.phase === "cruces")
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
  const preferredGroups =
    standingsConfig[categoria].find((item) => item.label === yearLabel)?.groups ?? [];
  const hasMatches = matches.length > 0;

  return (
    <PageBackground imageKey="partidos" className="min-h-[40vh]">
      <ContentSection
        title={`Categoría ${yearLabel}`}
        description={`${category.title} · partidos ordenados por grupo.`}
      >
        <Link
          href={`/partidos/${categoria}`}
          className="mb-6 inline-block text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          ← Todas las categorías
        </Link>

        {!hasMatches ? (
          <div className="rounded-2xl border border-dashed border-yellow-400/30 bg-black/40 p-8 text-center sm:p-12">
            <p className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400">
              Fixture próximamente
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/75">
              Todavía no hay partidos cargados para la categoría {yearLabel}.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400 sm:text-xl">
                  Fase de grupos
                </h2>
                {preferredGroups.length > 0 ? (
                  <p className="text-xs text-white/50 sm:text-sm">
                    Grupos {preferredGroups.join(" · ")}
                  </p>
                ) : null}
              </div>
              <MatchesByGroup matches={grupos} preferredGroups={preferredGroups} />
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400 sm:text-xl">
                Cruces
              </h2>
              {cruces.length > 0 ? (
                <div className="space-y-6">
                  {[
                    {
                      key: "oro",
                      title: "Copa de Oro",
                      items: cruces.filter((m) =>
                        (m.roundLabel ?? "").toLowerCase().includes("copa de oro"),
                      ),
                    },
                    {
                      key: "plata",
                      title: "Copa de Plata",
                      items: cruces.filter((m) =>
                        (m.roundLabel ?? "").toLowerCase().includes("copa de plata"),
                      ),
                    },
                    {
                      key: "otros",
                      title: "Otros cruces",
                      items: cruces.filter((m) => {
                        const label = (m.roundLabel ?? "").toLowerCase();
                        return !label.includes("copa de oro") && !label.includes("copa de plata");
                      }),
                    },
                  ]
                    .filter((section) => section.items.length > 0)
                    .map((section) => (
                      <div
                        key={section.key}
                        className="overflow-hidden rounded-2xl border border-yellow-400/20 bg-black/40"
                      >
                        <header className="border-b border-yellow-400/15 bg-yellow-400/10 px-4 py-3 sm:px-5">
                          <h3 className="font-display text-base font-bold uppercase tracking-wide text-yellow-300 sm:text-lg">
                            {section.title}
                          </h3>
                        </header>
                        <div className="grid gap-3 p-3 sm:gap-4 sm:p-4 md:grid-cols-2">
                          {section.items.map((match) => (
                            <MatchCard key={match.id} match={match} />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-yellow-400/25 p-5 text-sm text-white/60">
                  Los cruces se publicarán cuando estén definidos.
                </p>
              )}
            </section>
          </div>
        )}
      </ContentSection>
    </PageBackground>
  );
}
