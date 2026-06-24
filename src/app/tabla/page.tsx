import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { StandingsTable } from "@/components/standings-table";
import { mockStandings } from "@/lib/mock-data";

export default function TablaPage() {
  const groups = Object.keys(mockStandings).sort();

  return (
    <PageBackground imageKey="tabla" className="min-h-[40vh]">
      <ContentSection
        title="Tabla de posiciones"
        description="Se actualiza automáticamente cuando se cargan resultados de partidos."
      >
        <div className="grid gap-6">
          {groups.map((group) => (
            <StandingsTable key={group} group={group} rows={mockStandings[group]} />
          ))}
        </div>
      </ContentSection>
    </PageBackground>
  );
}
