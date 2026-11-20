import Image from "next/image";
import Link from "next/link";
import { FileDown } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { siteConfig } from "@/config/site";
import { clubMapImage, clubMapPdf } from "@/lib/mock-data";

export default function ClubPage() {
  return (
    <PageBackground imageKey="club" className="min-h-[40vh]">
      <ContentSection
        title="El club"
        description={`Predio del ${siteConfig.club} en Ceres. Deslizá el croquis para ver todo el predio.`}
        action={
          <Link
            href={clubMapPdf}
            download="croquis-ccao.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300"
          >
            <FileDown className="h-4 w-4" />
            Descargar PDF
          </Link>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-yellow-400/20 bg-[#efe6d2] shadow-lg shadow-black/40">
          <a
            href={clubMapImage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Image
              src={clubMapImage}
              alt="Croquis del predio del Club Central Argentino Olímpico"
              width={4174}
              height={1142}
              className="h-[280px] w-auto max-w-none sm:h-[340px] lg:h-[400px]"
              sizes="100vw"
              priority
            />
          </a>
        </div>
      </ContentSection>
    </PageBackground>
  );
}
