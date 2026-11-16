import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { TournamentCategoryPicker } from "@/components/tournament-category-picker";

export default function PartidosPage() {
  return (
    <PageBackground imageKey="partidos" className="min-h-[40vh]">
      <ContentSection
        title="Partidos"
        description="Elegí masculino o femenino para ver el fixture por categoría."
      >
        <TournamentCategoryPicker basePath="/partidos" ctaLabel="Ver fixture →" />
      </ContentSection>
    </PageBackground>
  );
}
