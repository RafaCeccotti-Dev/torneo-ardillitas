import { createClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/public";

/** Bypass RLS — solo en API routes del servidor. Requiere SUPABASE_SERVICE_ROLE_KEY. */
export function createServiceClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no configurado");
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY. Agregala en .env.local y en Vercel (Settings → Environment Variables).",
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
