import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { TournamentCategoryPicker } from "@/components/tournament-category-picker";

export default function ReglamentoPage() {
  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title="Reglamento"
        description="Elegí masculino o femenino para ver el reglamento oficial."
      >
        <TournamentCategoryPicker
          hrefBase="/reglamento"
          cta="Ver reglamento →"
          description="Reglamento oficial Ardillitas 2026, con PDF para descargar."
        />
      </ContentSection>
    </PageBackground>
  );
}
