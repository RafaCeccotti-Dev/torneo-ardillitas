import { AdminNav } from "@/components/admin/admin-nav";
import { FotosUpload } from "@/components/admin/fotos-upload";
import { ContentSection } from "@/components/content-section";
import { getGalleryPhotos } from "@/lib/content";

export default async function AdminFotosPage() {
  const photos = await getGalleryPhotos();

  return (
    <div className="bg-black">
      <ContentSection title="Fotos" description="Imágenes publicadas en /fotos del sitio.">
        <AdminNav />
        <FotosUpload photos={photos} />
      </ContentSection>
    </div>
  );
}
