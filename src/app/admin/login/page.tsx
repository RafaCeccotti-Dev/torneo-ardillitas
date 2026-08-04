import { ContentSection } from "@/components/content-section";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function AdminLoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="bg-black">
      <ContentSection
        title="Panel del coordinador"
        description="Ingresá para cargar reglamento y fotos del torneo."
      >
        {configured ? (
          <LoginForm />
        ) : (
          <div className="rounded-2xl border border-dashed border-yellow-400/30 bg-yellow-400/5 p-6 text-sm text-white/75">
            <p>Falta configurar Supabase en las variables de entorno:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
            <p className="mt-4">Agregalas en Vercel y en un archivo .env.local para probar en tu PC.</p>
          </div>
        )}
      </ContentSection>
    </div>
  );
}
