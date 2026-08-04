import Link from "next/link";
import { FileDown } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { getReglamentoFile } from "@/lib/content";
import { regulation } from "@/lib/mock-data";

export default async function ReglamentoPage() {
  const reglamento = await getReglamentoFile();

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title="Reglamento"
        description="Normas del torneo para equipos, jugadores y familias."
      >
        <div className="mb-6">
          {reglamento ? (
            <Link
              href={reglamento.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300"
            >
              <FileDown className="h-4 w-4" />
              Descargar PDF del reglamento
            </Link>
          ) : (
            <p className="rounded-full border border-dashed border-yellow-400/30 px-5 py-2.5 text-sm text-white/60">
              El PDF del reglamento se publicará próximamente.
            </p>
          )}
        </div>
        <div className="whitespace-pre-line rounded-2xl border border-yellow-400/15 bg-black/50 p-6 text-sm leading-7 text-white/85">
          {regulation.text}
        </div>
      </ContentSection>
    </PageBackground>
  );
}
