import Image from "next/image";
import Link from "next/link";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { siteConfig } from "@/config/site";
import { mockGallery } from "@/lib/mock-data";

export default function FotosPage() {
  return (
    <PageBackground imageKey="fotos" className="min-h-[40vh]">
      <ContentSection
        title="Fotos del torneo"
        description="Galería destacada en la web. El álbum completo puede vivir en Google Drive."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockGallery.map((photo) => (
            <figure
              key={photo.id}
              className="overflow-hidden rounded-2xl border border-yellow-400/15 bg-black/50"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={photo.src}
                  alt={photo.caption}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <figcaption className="p-3 text-sm text-white/80">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>

        {siteConfig.drivePhotosUrl ? (
          <div className="mt-8">
            <Link
              href={siteConfig.drivePhotosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300"
            >
              Ver todas las fotos en Drive
            </Link>
          </div>
        ) : (
          <p className="mt-6 text-sm text-white/60">
            Cuando el club defina el link de Drive, lo configuramos en{" "}
            <code className="rounded bg-white/10 px-1">src/config/site.ts</code>.
          </p>
        )}
      </ContentSection>
    </PageBackground>
  );
}
