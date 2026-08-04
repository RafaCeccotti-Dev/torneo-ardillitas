import Image from "next/image";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { siteConfig } from "@/config/site";
import { clubMapImage } from "@/lib/mock-data";

export default function ClubPage() {
  return (
    <PageBackground imageKey="club" className="min-h-[40vh]">
      <ContentSection
        title="El club"
        description={`Plano del predio del ${siteConfig.club} en Ceres.`}
      >
        <div className="overflow-hidden rounded-2xl border border-yellow-400/15 bg-neutral-950">
          <Image
            src={clubMapImage}
            alt="Plano del Club Central Argentino Olímpico"
            width={1400}
            height={1000}
            className="h-auto w-full"
            sizes="(max-width: 1200px) 100vw, 960px"
          />
        </div>
        <p className="mt-4 text-sm text-white/65">
          Plano de referencia del club para orientarse durante el torneo.
        </p>
      </ContentSection>
    </PageBackground>
  );
}
