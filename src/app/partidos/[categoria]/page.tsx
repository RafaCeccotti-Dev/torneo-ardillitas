import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { YearCategoryPicker } from "@/components/year-category-picker";
import { getMatches } from "@/lib/content";
import {
  isTournamentCategorySlug,
  listYearLabels,
  tournamentCategories,
} from "@/lib/tournament-categories";

export const revalidate = 60;

type PartidosCategoriaPageProps = {
  params: { categoria: string };
};

export function generateStaticParams() {
  return tournamentCategories.map((category) => ({ categoria: category.slug }));
}

export default async function PartidosCategoriaPage({ params }: PartidosCategoriaPageProps) {
  if (!isTournamentCategorySlug(params.categoria)) {
    notFound();
  }

  const categoria = params.categoria;
  const category = tournamentCategories.find((item) => item.slug === categoria)!;
  const matches = await getMatches({ category: categoria });
  const yearsWithMatches = Array.from(new Set(matches.map((m) => m.yearLabel)));
  const years = listYearLabels(categoria, yearsWithMatches);

  return (
    <PageBackground imageKey="partidos" className="min-h-[40vh]">
      <ContentSection
        title={category.title}
        description="Elegí la categoría de nacimiento para ver solo esos partidos."
      >
        <Link
          href="/partidos"
          className="mb-6 inline-block text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          ← Elegir masculino o femenino
        </Link>

        <YearCategoryPicker
          basePath={`/partidos/${categoria}`}
          years={years}
          yearsWithContent={yearsWithMatches}
        />
      </ContentSection>
    </PageBackground>
  );
}
