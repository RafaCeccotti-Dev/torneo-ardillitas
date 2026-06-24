import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { StandingsTable } from "@/components/standings-table";
import { mockStandingsByCategory } from "@/lib/standings-data";
import {
  isTournamentCategorySlug,
  standingsConfig,
  tournamentCategories,
} from "@/lib/tournament-categories";

type TablaCategoriaPageProps = {
  params: { categoria: string };
};

export function generateStaticParams() {
  return tournamentCategories.map((category) => ({ categoria: category.slug }));
}

export default function TablaCategoriaPage({ params }: TablaCategoriaPageProps) {
  if (!isTournamentCategorySlug(params.categoria)) {
    notFound();
  }

  const category = tournamentCategories.find((item) => item.slug === params.categoria)!;
  const yearCategories = standingsConfig[params.categoria];
  const standingsData = mockStandingsByCategory[params.categoria];

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title={category.title}
        description="Posiciones por categoría de nacimiento y grupo. Se actualiza cuando el coordinador carga resultados."
      >
        <Link
          href="/tabla"
          className="mb-8 inline-block text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          ← Elegir masculino o femenino
        </Link>

        <div className="space-y-12">
          {yearCategories.map((yearCategory) => (
            <section key={yearCategory.label}>
              <h2 className="font-display mb-6 border-b border-yellow-400/25 pb-3 text-2xl font-bold uppercase tracking-wide text-yellow-400 md:text-3xl">
                Categoría {yearCategory.label}
              </h2>
              <div className="grid gap-6">
                {yearCategory.groups.map((group) => {
                  const rows = standingsData[yearCategory.label]?.[group] ?? [];

                  return (
                    <StandingsTable
                      key={`${yearCategory.label}-${group}`}
                      group={group}
                      rows={rows}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </ContentSection>
    </PageBackground>
  );
}
