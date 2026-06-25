import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { backgroundImages, siteConfig } from "@/config/site";

export function PreinscripcionBanner() {
  return (
    <section className="relative isolate overflow-hidden border-y border-yellow-400/25">
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImages.preinscripcion})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/15 via-black/35 to-black/70 md:to-black/75"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 md:flex-row md:gap-10 md:py-12">
        <div className="relative h-36 w-36 shrink-0 md:h-44 md:w-44">
          <Image
            src={siteConfig.logos.mascot}
            alt="Mascota Ardillitas"
            fill
            className="object-contain drop-shadow-lg"
            sizes="176px"
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400 drop-shadow-sm">
            Edición {siteConfig.edition} · {siteConfig.tournamentDates}
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-wide text-white drop-shadow-md md:text-3xl">
            ¿Querés ir asegurando tu lugar?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 drop-shadow-sm md:text-base">
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
