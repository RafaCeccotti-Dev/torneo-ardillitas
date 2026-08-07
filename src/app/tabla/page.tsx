import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { TournamentCategoryPicker } from "@/components/tournament-category-picker";

export default function TablaPage() {
  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title="Tabla de posiciones"
        description="Elegí masculino o femenino. Las tablas se publicarán antes del torneo."
      >
        <TournamentCategoryPicker />
      </ContentSection>
    </PageBackground>
  );
}
