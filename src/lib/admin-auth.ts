import { NextResponse } from "next/server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ error: "Supabase no configurado" }, { status: 503 }) };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const email = user.email?.trim().toLowerCase() ?? "";
  if (allowed.length && !allowed.includes(email)) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  return { supabase };
}
