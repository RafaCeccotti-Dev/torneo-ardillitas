import type { GalleryPhoto } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type ReglamentoFile = {
  url: string;
  updatedAt: string;
} | null;

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id, storage_path, caption, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    src: supabase.storage.from("galeria").getPublicUrl(row.storage_path).data.publicUrl,
    caption: row.caption ?? "",
  }));
}

export async function getReglamentoFile(): Promise<ReglamentoFile> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_documents")
    .select("storage_path, updated_at")
    .eq("key", "reglamento")
    .maybeSingle();

  if (error || !data) return null;

  return {
    url: supabase.storage.from("reglamento").getPublicUrl(data.storage_path).data.publicUrl,
    updatedAt: data.updated_at,
  };
}
