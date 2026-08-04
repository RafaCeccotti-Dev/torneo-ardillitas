import { NextResponse } from "next/server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

async function requireAuth() {
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

  return { supabase };
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
  }

  const storagePath = "reglamento.pdf";
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("reglamento")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: dbError } = await supabase.from("site_documents").upsert({
    key: "reglamento",
    storage_path: storagePath,
    updated_at: new Date().toISOString(),
  });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
