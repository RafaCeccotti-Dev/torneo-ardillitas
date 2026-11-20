import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { MatchCard } from "@/components/match-card";
import { MatchesByGroup } from "@/components/matches-by-group";
import { PageBackground } from "@/components/page-background";
import { getMatches } from "@/lib/content";
import { femaleFormatNotes } from "@/data/official-fixtures-femenino";
import { knockoutRound } from "@/lib/knockout";
import { crucesQualificationNotes } from "@/lib/standings";
import {
  isTournamentCategorySlug,
  resolveYearLabel,
  standingsConfig,
  tournamentCategories,
  yearConfig,
  yearDisplayName,
  yearLabelToSlug,
} from "@/lib/tournament-categories";
import type { Match } from "@/lib/types";

const ROUND_ORDER = ["cuartos", "semis", "final", "otro"] as const;
const ROUND_TITLE: Record<(typeof ROUND_ORDER)[number], string> = {
  cuartos: "Cuartos de final",
  semis: "Semifinales",
  final: "Final",
  otro: "Otros",
};

function groupByRound(items: Match[]) {
  return ROUND_ORDER.map((round) => ({
    round,
    title: ROUND_TITLE[round],
    items: items.filter((match) => knockoutRound(match.roundLabel) === round),
  })).filter((group) => group.items.length > 0);
}

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
  const config = yearConfig(categoria, yearLabel);
  const preferredGroups =
    categoria === "femenino" && yearLabel === "2011"
      ? [...(config?.groups ?? []), "Interzonal"]
      : config?.groups ?? [];
  const singleTable = Boolean(config?.singleTable);
  const hasMatches = matches.length > 0;
  const formatNote =
    categoria === "femenino"
      ? femaleFormatNotes[yearLabel]
      : crucesQualificationNotes[yearLabel];
  const displayTitle = yearDisplayName(categoria, yearLabel);

  const crucesBuckets =
    categoria === "femenino"
      ? [
          {
            key: "oro",
            title: "Copa de Oro",
            items: cruces.filter((m) => (m.roundLabel ?? "").toLowerCase().includes("copa de oro")),
          },
          {
            key: "plata",
            title: "Copa de Plata",
            items: cruces.filter((m) => (m.roundLabel ?? "").toLowerCase().includes("copa de plata")),
          },
        ]
      : [
          {
            key: "oro",
            title: "Copa de Oro",
            items: cruces.filter((m) => (m.roundLabel ?? "").toLowerCase().includes("copa de oro")),
          },
          {
            key: "plata",
            title: "Copa de Plata",
            items: cruces.filter((m) => (m.roundLabel ?? "").toLowerCase().includes("copa de plata")),
          },
          {
            key: "otros",
            title: "Otros cruces",
            items: cruces.filter((m) => {
              const label = (m.roundLabel ?? "").toLowerCase();
              return !label.includes("copa de oro") && !label.includes("copa de plata");
            }),
          },
        ];

  return (
    <PageBackground imageKey="partidos" className="min-h-[40vh]">
      <ContentSection
        title={`Categoría ${displayTitle}`}
        description={
          singleTable
            ? `${category.title} · fase inicial y cruces.`
            : `${category.title} · partidos ordenados por grupo.`
        }
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
              {formatNote ?? `Todavía no hay partidos cargados para la categoría ${displayTitle}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {formatNote ? (
              <p className="rounded-2xl border border-yellow-400/20 bg-black/40 px-4 py-3 text-sm leading-relaxed text-white/75 sm:px-5">
                {formatNote}
              </p>
            ) : null}
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400 sm:text-xl">
                  {singleTable ? "Fase inicial" : "Fase de grupos"}
                </h2>
                {!singleTable && preferredGroups.length > 0 ? (
                  <p className="text-xs text-white/50 sm:text-sm">
                    Grupos {preferredGroups.join(" · ")}
                  </p>
                ) : null}
              </div>
              <MatchesByGroup
                matches={grupos}
                preferredGroups={preferredGroups}
                unifiedHeading={singleTable ? "Todos contra todos" : undefined}
              />
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400 sm:text-xl">
                Cruces
              </h2>
              {cruces.length > 0 ? (
                <div className="space-y-6">
                  {crucesBuckets
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
                        <div className="space-y-5 p-3 sm:p-4">
                          {groupByRound(section.items).map((group) => (
                            <div key={group.round} className="space-y-3">
                              {groupByRound(section.items).length > 1 ? (
                                <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400/80">
                                  {group.title}
                                </p>
                              ) : null}
                              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                                {group.items.map((match) => (
                                  <MatchCard key={match.id} match={match} />
                                ))}
                              </div>
                            </div>
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
