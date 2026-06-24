import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { siteConfig } from "@/config/site";

export function PreinscripcionBanner() {
  return (
    <section className="border-y border-yellow-400/25 bg-gradient-to-r from-yellow-400/15 via-black to-yellow-400/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 md:flex-row md:gap-10 md:py-12">
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Edición {siteConfig.edition} · {siteConfig.tournamentDates}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            ¿Querés ir asegurando tu lugar?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
            Completá la preinscripción del Torneo Nacional de Fútbol Infantil
            Ardillitas. El formulario no confirma la inscripción definitiva: la
            organización se comunicará con cada institución para los detalles.
          </p>
          <a
            href={siteConfig.preinscripcionFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            Preinscribirme
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
