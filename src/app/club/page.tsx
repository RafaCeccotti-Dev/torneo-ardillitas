import { ContentSection } from "@/components/content-section";
import { PageBackground } from "@/components/page-background";
import { siteConfig } from "@/config/site";
import { formatEdition } from "@/lib/edition";

export default function ClubPage() {
  return (
    <PageBackground imageKey="club" className="min-h-[40vh]">
      <ContentSection
        title="El club"
        description={`Predio del ${siteConfig.club} en Ceres.`}
      >
        <div className="rounded-2xl border border-dashed border-yellow-400/30 bg-black/40 p-8 text-center sm:p-12">
          <p className="font-display text-lg font-semibold uppercase tracking-wide text-yellow-400">
            Plano próximamente
          </p>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/75">
            El plano del club será publicado próximamente para orientarte durante la
            edición {formatEdition()} del torneo &quot;Ardillitas&quot;.
          </p>
        </div>
      </ContentSection>
    </PageBackground>
  );
}
