import { AdminNav } from "@/components/admin/admin-nav";
import { AcreditacionManager } from "@/components/admin/acreditacion-manager";
import { ContentSection } from "@/components/content-section";

export default function AdminAcreditacionPage() {
  return (
    <div className="bg-black">
      <ContentSection
        title="Acreditación"
        description="Elegí un club, generá el link y pasáselo al DT. Él ve solo las categorías en las que ese club está inscripto."
      >
        <AdminNav />
        <AcreditacionManager />
      </ContentSection>
    </div>
  );
}
