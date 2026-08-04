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
  const caption = String(formData.get("caption") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("galeria")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("gallery_photos")
    .select("*", { count: "exact", head: true });

  const { data, error: dbError } = await supabase
    .from("gallery_photos")
    .insert({
      storage_path: storagePath,
      caption,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  const { data: row, error: fetchError } = await supabase
    .from("gallery_photos")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }

  await supabase.storage.from("galeria").remove([row.storage_path]);
  const { error: deleteError } = await supabase.from("gallery_photos").delete().eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
