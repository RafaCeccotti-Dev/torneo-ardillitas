import { AdminNav } from "@/components/admin/admin-nav";
import { ReglamentoUpload } from "@/components/admin/reglamento-upload";
import { ContentSection } from "@/components/content-section";
import { getReglamentoFile } from "@/lib/content";

export default async function AdminReglamentoPage() {
  const reglamento = await getReglamentoFile();

  return (
    <div className="bg-black">
      <ContentSection title="Reglamento" description="PDF visible en la sección pública del sitio.">
        <AdminNav />
        <ReglamentoUpload currentUrl={reglamento?.url ?? null} />
      </ContentSection>
    </div>
  );
}
