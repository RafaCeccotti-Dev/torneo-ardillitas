import { ExternalLink, MapPin } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { mockPlaces } from "@/lib/mock-data";

export default function UbicacionesPage() {
  return (
    <PageBackground imageKey="ubicaciones" className="min-h-[40vh]">
      <ContentSection
        title="Ubicaciones útiles"
        description="Puntos de referencia en la ciudad para familias y equipos visitantes."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {mockPlaces.map((place) => (
            <article
              key={place.id}
              className="rounded-2xl border border-yellow-400/15 bg-black/50 p-5 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-yellow-400" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{place.name}</h2>
                  <p className="mt-1 text-sm text-white/75">{place.description}</p>
                  <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-yellow-400 hover:text-yellow-300"
                  >
                    Abrir en Google Maps
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </ContentSection>
    </PageBackground>
  );
}
