import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { YearCategoryPicker } from "@/components/year-category-picker";
import { getStandingsForCategory } from "@/lib/content";
import {
  isTournamentCategorySlug,
  listYearLabels,
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
  const yearsWithTables = Object.keys(standings);
  const years = listYearLabels(categoria, yearsWithTables);

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title={category.title}
        description={
          categoria === "femenino"
            ? "Elegí la categoría de nacimiento para ver la tabla general."
            : "Elegí la categoría de nacimiento para ver solo esa tabla."
        }
      >
        <Link
          href="/tabla"
          className="mb-6 inline-block text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          ← Elegir masculino o femenino
        </Link>

        <YearCategoryPicker
          basePath={`/tabla/${categoria}`}
          category={categoria}
          years={years}
          yearsWithContent={yearsWithTables}
        />
      </ContentSection>
    </PageBackground>
  );
}
