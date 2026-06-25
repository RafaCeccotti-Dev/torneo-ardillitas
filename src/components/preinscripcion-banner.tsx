import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { backgroundImages, siteConfig } from "@/config/site";

export function PreinscripcionBanner() {
  return (
    <section className="relative overflow-hidden border-y border-yellow-400/25">
      <Image
        src={backgroundImages.preinscripcion}
        alt=""
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/75" />

      <div className="relative z-10">
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
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
              Edición {siteConfig.edition} · {siteConfig.tournamentDates}
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
              ¿Querés ir asegurando tu lugar?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
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

        {siteConfig.preinscripcionSponsors.length > 0 ? (
          <div className="border-t border-yellow-400/20 bg-black/45 px-4 py-8 backdrop-blur-sm">
            <div className="mx-auto max-w-5xl">
              <p className="font-display mb-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-yellow-400">
                Auspiciantes
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                {siteConfig.preinscripcionSponsors.map((sponsor) => (
                  <a
                    key={sponsor.name}
                    href={sponsor.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={sponsor.name}
                    className="opacity-95 transition hover:opacity-100 hover:scale-[1.02]"
                  >
                    <div className="flex h-28 w-48 items-center justify-center rounded-2xl bg-white px-4 py-3 shadow-lg sm:h-32 sm:w-56 md:h-36 md:w-64">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
