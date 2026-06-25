"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function AdminNav() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-3 border-b border-yellow-400/20 pb-4">
      <Link
        href="/admin/dashboard"
        className="rounded-full px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Inicio
      </Link>
      <Link
        href="/admin/dashboard/reglamento"
        className="rounded-full px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Reglamento
      </Link>
      <Link
        href="/admin/dashboard/partidos"
        className="rounded-full px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Partidos
      </Link>
      <Link
        href="/admin/dashboard/fotos"
        className="rounded-full px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Fotos
      </Link>
      <button
        type="button"
        onClick={() => void logout()}
        className="ml-auto rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
      >
        Salir
      </button>
    </nav>
  );
}
