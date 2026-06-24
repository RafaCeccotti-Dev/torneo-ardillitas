import Link from "next/link";
import { FileDown } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { regulation } from "@/lib/mock-data";

export default function ReglamentoPage() {
  return (
    <PageBackground imageKey="reglamento" className="min-h-[40vh]">
      <ContentSection
        title="Reglamento"
        description="Normas del torneo para equipos, jugadores y familias."
      >
        <div className="mb-6">
          <Link
            href={regulation.pdfUrl}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <FileDown className="h-4 w-4" />
            Descargar PDF (cuando esté cargado)
          </Link>
        </div>
        <div className="whitespace-pre-line rounded-2xl border border-yellow-400/15 bg-black/50 p-6 text-sm leading-7 text-white/85">
          {regulation.text}
        </div>
      </ContentSection>
    </PageBackground>
  );
}
