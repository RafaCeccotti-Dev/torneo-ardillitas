import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidateTournamentPages } from "@/lib/revalidate-tournament";
import {
  isTournamentCategorySlug,
  standingsConfig,
} from "@/lib/tournament-categories";

const TEAM_SELECT =
  "id, name, slug, category, year_label, group_name, sort_order, logo_path, created_at";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type TeamDbRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  year_label: string;
  group_name: string;
  sort_order: number;
  logo_path: string | null;
  created_at?: string;
};

function publicLogoUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  logoPath: string | null | undefined,
) {
  if (!logoPath) return null;
  return supabase.storage.from("escudos").getPublicUrl(logoPath).data.publicUrl as string;
}

function mapTeam(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  row: TeamDbRow,
) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    year_label: row.year_label,
    yearLabel: row.year_label,
    group_name: row.group_name,
    groupName: row.group_name,
    sort_order: row.sort_order,
    logo_path: row.logo_path,
    logoUrl: publicLogoUrl(supabase, row.logo_path),
    createdAt: row.created_at ?? null,
  };
}

async function uniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  base: string,
  category: string,
  yearLabel: string,
  excludeId?: string,
) {
  let candidate = base || "equipo";
  let attempt = 1;

  while (attempt < 50) {
    let query = supabase
      .from("teams")
      .select("id")
      .eq("slug", candidate)
      .eq("category", category)
      .eq("year_label", yearLabel)
      .limit(1);

    if (excludeId) query = query.neq("id", excludeId);

    const { data } = await query;
    if (!data?.length) return candidate;
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }

  return `${base}-${Date.now()}`;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const yearLabel = searchParams.get("yearLabel");

  let query = supabase
    .from("teams")
    .select(TEAM_SELECT)
    .order("year_label", { ascending: true })
    .order("group_name", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (category) query = query.eq("category", category);
  if (yearLabel) query = query.eq("year_label", yearLabel);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    teams: (data ?? []).map((row) => mapTeam(supabase, row)),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const yearLabel = String(formData.get("yearLabel") ?? "").trim();
  const groupName = String(formData.get("groupName") ?? "")
    .trim()
    .toUpperCase();
  const file = formData.get("logo");

  if (!name) {
    return NextResponse.json({ error: "El nombre del equipo es obligatorio" }, { status: 400 });
  }
  if (!isTournamentCategorySlug(category)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }
  if (!yearLabel || !standingsConfig[category].some((item) => item.label === yearLabel)) {
    return NextResponse.json({ error: "Año / categoría de nacimiento inválida" }, { status: 400 });
  }
  if (!groupName) {
    return NextResponse.json({ error: "El grupo es obligatorio" }, { status: 400 });
  }

  let logoPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El escudo debe ser JPG o PNG" }, { status: 400 });
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten JPG, PNG o WebP" }, { status: 400 });
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    logoPath = `${category}/${yearLabel.replace(/\//g, "-")}/${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("escudos").upload(logoPath, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json(
        {
          error: uploadError.message.includes("Bucket not found")
            ? "Falta crear el bucket 'escudos' en Supabase Storage (público)."
            : uploadError.message,
        },
        { status: 500 },
      );
    }
  }

  const { count } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .eq("category", category)
    .eq("year_label", yearLabel)
    .eq("group_name", groupName);

  const slug = await uniqueSlug(supabase, slugify(name), category, yearLabel);

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name,
      slug,
      category,
      year_label: yearLabel,
      group_name: groupName,
      sort_order: count ?? 0,
      logo_path: logoPath,
    })
    .select(TEAM_SELECT)
    .single();

  if (error) {
    if (logoPath) await supabase.storage.from("escudos").remove([logoPath]);
    return NextResponse.json(
      {
        error: error.message.includes("logo_path")
          ? "Falta agregar la columna logo_path en la tabla teams (ejecutá supabase/add-team-logos.sql)."
          : error.message,
      },
      { status: 500 },
    );
  }

  revalidateTournamentPages();
  return NextResponse.json({ ok: true, team: mapTeam(supabase, data) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const formData = await request.formData();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Falta id del equipo" }, { status: 400 });
  }

  const { data: current, error: fetchError } = await supabase
    .from("teams")
    .select(TEAM_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }

  const name = String(formData.get("name") ?? current.name).trim();
  const category = String(formData.get("category") ?? current.category).trim();
  const yearLabel = String(formData.get("yearLabel") ?? current.year_label).trim();
  const groupName = String(formData.get("groupName") ?? current.group_name)
    .trim()
    .toUpperCase();
  const file = formData.get("logo");

  if (!name) {
    return NextResponse.json({ error: "El nombre del equipo es obligatorio" }, { status: 400 });
  }
  if (!isTournamentCategorySlug(category)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }
  if (!yearLabel || !standingsConfig[category].some((item) => item.label === yearLabel)) {
    return NextResponse.json({ error: "Año / categoría de nacimiento inválida" }, { status: 400 });
  }
  if (!groupName) {
    return NextResponse.json({ error: "El grupo es obligatorio" }, { status: 400 });
  }

  let logoPath = current.logo_path as string | null;
  let uploadedPath: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten JPG, PNG o WebP" }, { status: 400 });
    }
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    uploadedPath = `${category}/${yearLabel.replace(/\//g, "-")}/${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("escudos")
      .upload(uploadedPath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    logoPath = uploadedPath;
  }

  const slug =
    name !== current.name || category !== current.category || yearLabel !== current.year_label
      ? await uniqueSlug(supabase, slugify(name), category, yearLabel, id)
      : current.slug;

  const { data, error } = await supabase
    .from("teams")
    .update({
      name,
      slug,
      category,
      year_label: yearLabel,
      group_name: groupName,
      logo_path: logoPath,
    })
    .eq("id", id)
    .select(TEAM_SELECT)
    .single();

  if (error) {
    if (uploadedPath) await supabase.storage.from("escudos").remove([uploadedPath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (uploadedPath && current.logo_path && current.logo_path !== uploadedPath) {
    await supabase.storage.from("escudos").remove([current.logo_path]);
  }

  revalidateTournamentPages();
  return NextResponse.json({ ok: true, team: mapTeam(supabase, data) });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase } = auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  const { data: row, error: fetchError } = await supabase
    .from("teams")
    .select("id, logo_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }

  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      {
        error: error.message.includes("matches")
          ? "No se puede eliminar: el equipo tiene partidos cargados. Borrá esos partidos primero."
          : error.message,
      },
      { status: 500 },
    );
  }

  if (row.logo_path) {
    await supabase.storage.from("escudos").remove([row.logo_path]);
  }

  revalidateTournamentPages();
  return NextResponse.json({ ok: true });
}
