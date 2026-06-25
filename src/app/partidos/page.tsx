import { ContentSection } from "@/components/content-section";
import { MatchCard } from "@/components/match-card";
import { PageBackground } from "@/components/page-background";
import { getMatches } from "@/lib/content";
import { mockMatches } from "@/lib/mock-data";

export default async function PartidosPage() {
  const loadedMatches = await getMatches();
  const matches = loadedMatches.length ? loadedMatches : mockMatches;
  const grupos = matches.filter((match) => match.phase === "grupos");
  const cruces = matches.filter((match) => match.phase === "cruces");

  return (
    <PageBackground imageKey="partidos" className="min-h-[40vh]">
      <ContentSection
        title="Partidos"
        description="Equipos, horarios y canchas del torneo."
      >
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-yellow-400">Fase de grupos</h2>
            {grupos.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {grupos.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-yellow-400/25 p-6 text-white/60">
                Todavía no hay partidos de grupos cargados.
              </p>
            )}
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
