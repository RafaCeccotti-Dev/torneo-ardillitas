import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const yearLabel = searchParams.get("yearLabel");

  let query = supabase
    .from("teams")
    .select("id, name, slug, category, year_label, group_name, sort_order")
    .order("sort_order", { ascending: true });

  if (category) query = query.eq("category", category);
  if (yearLabel) query = query.eq("year_label", yearLabel);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teams: data ?? [] });
}
