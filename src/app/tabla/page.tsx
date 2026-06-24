import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { TournamentCategoryPicker } from "@/components/tournament-category-picker";

export default function TablaPage() {
  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title="Tabla de posiciones"
        description="Elegí el torneo para ver las posiciones por grupo."
      >
        <TournamentCategoryPicker />
      </ContentSection>
    </PageBackground>
  );
}
