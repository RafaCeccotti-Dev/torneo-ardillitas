import { ContentSection } from "@/components/content-section";
import { MatchCard } from "@/components/match-card";
import { PageBackground } from "@/components/page-background";
import { mockMatches } from "@/lib/mock-data";

export default function PartidosPage() {
  const grupos = mockMatches.filter((match) => match.phase === "grupos");
  const cruces = mockMatches.filter((match) => match.phase === "cruces");

  return (
    <PageBackground imageKey="partidos" className="min-h-[40vh]">
      <ContentSection
        title="Partidos"
        description="Equipos, horarios y canchas del torneo."
      >
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-yellow-400">Fase de grupos</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {grupos.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
          {cruces.length > 0 ? (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-yellow-400">Cruces</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {cruces.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-yellow-400/25 p-6 text-white/60">
              Los cruces se publicarán cuando el coordinador los cargue.
            </p>
          )}
        </div>
      </ContentSection>
    </PageBackground>
  );
}
