import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { ContentSection } from "@/components/content-section";

export default function AdminDashboardPage() {
  return (
    <div className="bg-black">
      <ContentSection
        title="Panel del coordinador"
        description="Gestioná el contenido publicado en la web del torneo."
      >
        <AdminNav />
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/dashboard/reglamento"
            className="rounded-2xl border border-yellow-400/15 bg-white/5 p-6 transition hover:border-yellow-400/40"
          >
            <h2 className="font-display text-lg font-bold uppercase text-white">Reglamento</h2>
            <p className="mt-2 text-sm text-white/70">Subir o reemplazar el PDF del reglamento.</p>
          </Link>
          <Link
            href="/admin/dashboard/fotos"
            className="rounded-2xl border border-yellow-400/15 bg-white/5 p-6 transition hover:border-yellow-400/40"
          >
            <h2 className="font-display text-lg font-bold uppercase text-white">Fotos</h2>
            <p className="mt-2 text-sm text-white/70">Publicar imágenes en la galería del sitio.</p>
          </Link>
        </div>
        <p className="mt-8 text-sm text-white/50">
          Partidos y tabla de posiciones: próximamente, cuando estén definidos los equipos.
        </p>
      </ContentSection>
    </div>
  );
}
