import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";

import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { reglamentos } from "@/lib/reglamentos";
import {
  isTournamentCategorySlug,
  tournamentCategories,
} from "@/lib/tournament-categories";

type ReglamentoCategoriaPageProps = {
  params: { categoria: string };
};

export function generateStaticParams() {
  return tournamentCategories.map((category) => ({ categoria: category.slug }));
}

export default function ReglamentoCategoriaPage({ params }: ReglamentoCategoriaPageProps) {
  if (!isTournamentCategorySlug(params.categoria)) {
    notFound();
  }

  const reglamento = reglamentos[params.categoria];

  return (
    <PageBackground imageKey="hero" className="min-h-[40vh]">
      <ContentSection
        title={reglamento.title}
        description="Reglamento oficial del Torneo Ardillitas XVII."
      >
        <Link
          href="/reglamento"
          className="mb-6 inline-block text-sm font-medium text-yellow-400 hover:text-yellow-300"
        >
          ← Elegir masculino o femenino
        </Link>

        <div className="mb-8">
          <Link
            href={reglamento.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300"
          >
            <FileDown className="h-4 w-4" />
            Descargar PDF
          </Link>
        </div>

        <div className="space-y-8">
          <p className="rounded-2xl border border-yellow-400/15 bg-black/50 p-6 text-sm leading-7 text-white/85">
            {reglamento.intro}
          </p>
          {reglamento.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-yellow-400/15 bg-black/50 p-6"
            >
              <h2 className="font-display mb-3 text-lg font-semibold uppercase tracking-wide text-yellow-400">
                {section.title}
              </h2>
              <div className="whitespace-pre-line text-sm leading-7 text-white/85">{section.body}</div>
            </section>
          ))}
        </div>
      </ContentSection>
    </PageBackground>
  );
}
