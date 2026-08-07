import { AdminNav } from "@/components/admin/admin-nav";
import { EquiposManager } from "@/components/admin/equipos-manager";
import { ContentSection } from "@/components/content-section";

export default function AdminEquiposPage() {
  return (
    <div className="bg-black">
      <ContentSection
        title="Equipos"
        description="Cargá los equipos por categoría, grupo y escudo. Se muestran en la tabla de posiciones."
      >
        <AdminNav />
        <EquiposManager />
      </ContentSection>
    </div>
  );
}
