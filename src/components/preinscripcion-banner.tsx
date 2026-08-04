import { ExternalLink } from "lucide-react";

import { backgroundImages, siteConfig } from "@/config/site";
import { formatEdition } from "@/lib/edition";

export function PreinscripcionBanner() {
  return (
    <section className="relative isolate w-full overflow-hidden border-y border-yellow-400/25">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImages.preinscripcion})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-black/30 md:bg-black/20"
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-[280px] items-center justify-center px-4 py-10 sm:min-h-[320px] md:py-12">
        <div className="w-full max-w-xl rounded-2xl border border-yellow-400/25 bg-black/78 p-6 text-center shadow-2xl backdrop-blur-md md:p-8">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Edición {formatEdition()} · {siteConfig.tournamentDates}
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
            ¿Querés ir asegurando tu lugar?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/90 md:text-base">
            Completá la preinscripción del Torneo Nacional de Fútbol Infantil
            Ardillitas. El formulario no confirma la inscripción definitiva: la
            organización se comunicará con cada institución para los detalles.
          </p>
          <a
            href={siteConfig.preinscripcionFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-yellow-300"
          >
            Preinscribirme
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
