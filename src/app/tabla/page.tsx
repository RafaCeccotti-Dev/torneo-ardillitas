import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { TournamentFilters } from "@/components/tournament-filters";

export default function TablaPage() {
  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title="Tabla de posiciones"
        description="Elegí masculino o femenino y después la categoría para ver esa tabla."
      >
        <TournamentFilters basePath="/tabla" />
        <p className="rounded-2xl border border-dashed border-yellow-400/30 bg-black/40 p-8 text-center text-white/75">
          Tocá masculino o femenino para empezar.
        </p>
      </ContentSection>
    </PageBackground>
  );
}
