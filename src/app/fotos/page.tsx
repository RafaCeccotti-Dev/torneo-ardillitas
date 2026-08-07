import Image from "next/image";
import Link from "next/link";
import { Camera, ExternalLink } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { PageBackground } from "@/components/page-background";
import { siteConfig } from "@/config/site";
import { getGalleryPhotos } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function FotosPage() {
  const photos = await getGalleryPhotos();
  const hasPhotos = photos.length > 0;

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title="Fotos del torneo"
        description="Galería de imágenes del torneo y momentos destacados. Tocá una foto para verla en grande."
      >
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
              Todavía no hay fotos publicadas. Cuando se carguen imágenes del torneo, las
              vas a encontrar acá.
            </p>
          </div>
        )}

        {siteConfig.drivePhotosUrl ? (
          <div className="mt-8 text-center">
            <Link
              href={siteConfig.drivePhotosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300"
            >
              Ver todas las fotos en Drive
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </ContentSection>
    </PageBackground>
  );
}
