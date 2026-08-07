import type { GalleryPhoto, Match, Team } from "@/lib/types";
import { computeStandingsByGroup } from "@/lib/standings";
import type { StandingsByYear } from "@/lib/standings-data";
import type { TournamentCategorySlug } from "@/lib/tournament-categories";
import { standingsConfig } from "@/lib/tournament-categories";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/public";

export type ReglamentoFile = {
  url: string;
  updatedAt: string;
} | null;

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  year_label: string;
  group_name: string;
  sort_order: number;
  logo_path?: string | null;
};

type MatchRow = {
  id: string;
  category: string;
  year_label: string;
  phase: Match["phase"];
  round_label: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string;
  court: string;
  status: Match["status"];
};

function publicLogoUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath || !isSupabaseConfigured()) return null;
  const supabase = createPublicClient();
  return supabase.storage.from("escudos").getPublicUrl(logoPath).data.publicUrl;
}

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    group: row.group_name,
    category: row.category as TournamentCategorySlug,
    yearLabel: row.year_label,
    logoUrl: publicLogoUrl(row.logo_path),
  };
}

function buildMatch(row: MatchRow, home: Team, away: Team): Match {
  return {
    id: row.id,
    category: row.category as TournamentCategorySlug,
    yearLabel: row.year_label,
    phase: row.phase,
    roundLabel: row.round_label ?? undefined,
    homeTeam: home,
    awayTeam: away,
    homeScore: row.home_score,
    awayScore: row.away_score,
    kickoffAt: row.kickoff_at,
    court: row.court,
    status: row.status,
  };
}

export async function getTeams(filters?: {
  category?: TournamentCategorySlug;
  yearLabel?: string;
}): Promise<Team[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();

  async function fetchTeams(includeLogo: boolean) {
    const columns = includeLogo
      ? "id, name, slug, category, year_label, group_name, sort_order, logo_path"
      : "id, name, slug, category, year_label, group_name, sort_order";

    let query = supabase.from("teams").select(columns).order("sort_order", { ascending: true });

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.yearLabel) query = query.eq("year_label", filters.yearLabel);
    return query;
  }

  let { data, error } = await fetchTeams(true);
  if (error?.message?.includes("logo_path")) {
    ({ data, error } = await fetchTeams(false));
  }

  if (error || !data?.length) return [];

  return (data as unknown as TeamRow[]).map(mapTeam);
}

export async function getMatches(filters?: {
  category?: TournamentCategorySlug;
  yearLabel?: string;
}): Promise<Match[]> {
  if (!isSupabaseConfigured()) return [];

  // Fixture oculto hasta que el coordinador publique partidos reales.
  // Evita mostrar datos de prueba cargados en Supabase.
  const publishFixture = process.env.PUBLISH_FIXTURE === "true";
  if (!publishFixture) return [];

  const supabase = createPublicClient();
  let query = supabase
    .from("matches")
    .select(
      "id, category, year_label, phase, round_label, home_team_id, away_team_id, home_score, away_score, kickoff_at, court, status",
    )
    .order("kickoff_at", { ascending: true });

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.yearLabel) query = query.eq("year_label", filters.yearLabel);

  const { data: matchRows, error } = await query;
  if (error || !matchRows?.length) return [];

  const teamIds = Array.from(
    new Set(
      (matchRows as MatchRow[]).flatMap((row) => [row.home_team_id, row.away_team_id]),
    ),
  );

  const { data: teamRows, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, slug, category, year_label, group_name, sort_order, logo_path")
    .in("id", teamIds);

  if (teamsError || !teamRows?.length) return [];

  const teamMap = new Map((teamRows as TeamRow[]).map((row) => [row.id, mapTeam(row)]));

  return (matchRows as MatchRow[])
    .map((row) => {
      const home = teamMap.get(row.home_team_id);
      const away = teamMap.get(row.away_team_id);
      if (!home || !away) return null;
      return buildMatch(row, home, away);
    })
    .filter((match): match is Match => match !== null);
}

export async function getStandingsForCategory(
  category: TournamentCategorySlug,
): Promise<StandingsByYear> {
  const teams = await getTeams({ category });
  const matches = await getMatches({ category });
  const result: StandingsByYear = {};

  for (const yearCategory of standingsConfig[category]) {
    const yearLabel = yearCategory.label;
    const yearTeams = teams.filter((team) => team.yearLabel === yearLabel);
    if (yearTeams.length === 0) continue;

    const yearMatches = matches.filter(
      (match) => match.yearLabel === yearLabel && match.phase === "grupos",
    );
    result[yearLabel] = computeStandingsByGroup(yearTeams, yearMatches);
  }

  return result;
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
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

  const supabase = createPublicClient();
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
