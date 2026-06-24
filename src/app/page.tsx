import Link from "next/link";
import { CalendarDays, ExternalLink, MapPin, Trophy } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { MatchCard } from "@/components/match-card";
import { PageBackground } from "@/components/page-background";
import { PreinscripcionBanner } from "@/components/preinscripcion-banner";
import { siteConfig } from "@/config/site";
import { mockMatches } from "@/lib/mock-data";

export default function HomePage() {
  const upcoming = mockMatches.filter((match) => match.status === "programado").slice(0, 2);

  return (
    <>
      <PageBackground imageKey="hero" className="min-h-[85vh]">
        <div className="mx-auto flex max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:min-h-[85vh]">
          <p className="font-display mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400 sm:text-base sm:tracking-[0.28em]">
            {siteConfig.club} · {siteConfig.city}
          </p>
          <h1 className="font-display max-w-4xl text-5xl font-bold uppercase leading-[0.95] tracking-wide text-white sm:text-6xl md:text-7xl">
            {siteConfig.name}
          </h1>
          <p className="font-display mt-4 text-base font-medium uppercase tracking-widest text-yellow-400/95 sm:text-lg">
            Edición {siteConfig.edition} · {siteConfig.tournamentDates}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">
            Fixture, resultados, tabla de posiciones y toda la info del torneo en un
            solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={siteConfig.preinscripcionFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-yellow-300"
            >
              Preinscribirme
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/partidos"
              className="font-display rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
            >
              Ver partidos
            </Link>
            <Link
              href="/tabla"
              className="font-display rounded-full border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
            >
              Tabla de posiciones
            </Link>
          </div>
        </div>
      </PageBackground>

      <PreinscripcionBanner />

      <div className="bg-black">
        <ContentSection
          title="Próximos partidos"
          description="Datos de ejemplo — el coordinador los cargará desde el panel."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.length > 0 ? (
              upcoming.map((match) => <MatchCard key={match.id} match={match} />)
            ) : (
              <p className="text-white/70">No hay partidos programados por ahora.</p>
            )}
          </div>
        </ContentSection>

        <ContentSection title="Accesos rápidos" className="pt-0">
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/partidos"
              className="rounded-2xl border border-yellow-400/15 bg-white/5 p-5 transition hover:border-yellow-400/40 hover:bg-white/10"
            >
              <CalendarDays className="mb-3 h-8 w-8 text-yellow-400" />
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white">
                Partidos
              </h2>
              <p className="mt-1 text-sm text-white/70">Grupos y cruces</p>
            </Link>
            <Link
              href="/tabla"
              className="rounded-2xl border border-yellow-400/15 bg-white/5 p-5 transition hover:border-yellow-400/40 hover:bg-white/10"
            >
              <Trophy className="mb-3 h-8 w-8 text-yellow-400" />
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white">
                Tabla
              </h2>
              <p className="mt-1 text-sm text-white/70">Posiciones por grupo</p>
            </Link>
            <Link
              href="/ubicaciones"
              className="rounded-2xl border border-yellow-400/15 bg-white/5 p-5 transition hover:border-yellow-400/40 hover:bg-white/10"
            >
              <MapPin className="mb-3 h-8 w-8 text-yellow-400" />
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-white">
                Ubicaciones
              </h2>
              <p className="mt-1 text-sm text-white/70">Lugares útiles en la ciudad</p>
            </Link>
          </div>
        </ContentSection>
      </div>
    </>
  );
}
