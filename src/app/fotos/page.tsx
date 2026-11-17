import Image from "next/image";
import { Camera } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { PageBackground } from "@/components/page-background";
import { siteConfig } from "@/config/site";
import { MAX_GALLERY_PHOTOS } from "@/lib/accreditation";
import { getGalleryPhotos } from "@/lib/content";
import { whatsappUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function FotosPage() {
  const photos = (await getGalleryPhotos()).slice(0, MAX_GALLERY_PHOTOS);
  const hasPhotos = photos.length > 0;
  const pressUrl = whatsappUrl(
    siteConfig.pressWhatsapp.number,
    siteConfig.pressWhatsapp.message,
  );

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection title={`Imágenes Generales Torneo Ardillitas ${siteConfig.editionRoman}`}>
        <div className="mb-8 max-w-xl">
          <p className="text-base leading-relaxed text-white/80">
            Para fotos exclusivas de tu club, comunicate con nuestro equipo de prensa.
          </p>
          {pressUrl ? (
            <a
              href={pressUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-yellow-300"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp {siteConfig.pressWhatsapp.name}
            </a>
          ) : null}
          <p className="mt-2 text-sm text-white/50">3491 43-4968</p>
        </div>

        {hasPhotos ? (
          <GalleryLightbox photos={photos} />
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-yellow-400/25 bg-yellow-400/5 px-6 py-14 text-center">
            <div className="relative mb-6 h-24 w-24 opacity-90">
              <Image
                src={siteConfig.logos.mascot}
                alt=""
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
            <Camera className="mb-3 h-8 w-8 text-yellow-400" />
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white">
              Galería en preparación
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Todavía no hay fotos publicadas. Cuando se carguen, las vas a encontrar acá.
            </p>
          </div>
        )}
      </ContentSection>
    </PageBackground>
  );
}
