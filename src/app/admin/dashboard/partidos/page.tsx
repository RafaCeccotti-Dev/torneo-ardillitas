import { AdminNav } from "@/components/admin/admin-nav";
import { PartidosManager } from "@/components/admin/partidos-manager";
import { ContentSection } from "@/components/content-section";

export default function AdminPartidosPage() {
  return (
    <div className="bg-black">
      <ContentSection
        title="Partidos"
        description="Armá el fixture, cargá día, hora, cancha y resultados. La tabla se actualiza sola."
      >
        <AdminNav />
        <PartidosManager />
      </ContentSection>
    </div>
  );
}
