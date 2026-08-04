import { MessageCircle, Store, BedDouble, ClipboardList, UtensilsCrossed } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";

const icons = {
  stands: Store,
  alojamientos: BedDouble,
  viandas: UtensilsCrossed,
  inscripciones: ClipboardList,
} as const;

export default function InformacionPage() {
  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title="Información"
        description="Contactá al equipo del torneo según el tema que necesites."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.infoContacts.map((contact) => {
            const Icon = icons[contact.id as keyof typeof icons] ?? MessageCircle;
            const url = whatsappUrl(contact.number, contact.message);

            return (
              <article
                key={contact.id}
                className="flex flex-col rounded-2xl border border-yellow-400/15 bg-black/50 p-6"
              >
                <Icon className="mb-4 h-8 w-8 text-yellow-400" />
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                  {contact.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/75">
                  {contact.description}
                </p>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-yellow-300"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                ) : (
                  <p className="mt-6 rounded-full border border-dashed border-yellow-400/30 px-5 py-3 text-center text-sm text-white/50">
                    Número próximamente
                  </p>
                )}
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-white/60">
          Coordinación general del torneo:{" "}
          <a
            href={whatsappUrl(siteConfig.whatsapp.number, siteConfig.whatsapp.message) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300"
          >
            WhatsApp del coordinador
          </a>
        </p>
      </ContentSection>
    </PageBackground>
  );
}
