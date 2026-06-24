import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { StandingsTable } from "@/components/standings-table";
import {
  isTournamentCategorySlug,
  tournamentCategories,
} from "@/lib/tournament-categories";
import { mockStandingsByCategory } from "@/lib/mock-data";

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
  const standings = mockStandingsByCategory[params.categoria];
  const groups = Object.keys(standings).sort();

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title={category.title}
        description="Se actualiza cuando el coordinador carga resultados de partidos."
      >
        <Link
          href="/tabla"
          className="mb-6 inline-block text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          ← Elegir otra categoría
        </Link>

        {groups.length > 0 ? (
          <div className="grid gap-6">
            {groups.map((group) => (
              <StandingsTable key={group} group={group} rows={standings[group]} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-yellow-400/25 bg-yellow-400/5 px-6 py-10 text-center text-white/70">
            La tabla de {category.title.toLowerCase()} se publicará cuando el coordinador cargue
            los equipos y resultados.
          </p>
        )}
      </ContentSection>
    </PageBackground>
  );
}
