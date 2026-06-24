import Link from "next/link";

import { ContentSection } from "@/components/content-section";

export default function AdminPage() {
  return (
    <div className="bg-black">
      <ContentSection
        title="Panel de coordinadores"
        description="Próximo paso: login, equipos, partidos y fotos. Por ahora solo la web pública."
      >
        <div className="rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/5 p-6 text-white/80">
          <p>Acá van a poder:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>Cargar equipos y escudos</li>
            <li>Programar partidos de grupos y cruces</li>
            <li>Subir fotos y reglamento</li>
            <li>Actualizar ubicaciones y plano del club</li>
          </ul>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-yellow-400 hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </ContentSection>
    </div>
  );
}
