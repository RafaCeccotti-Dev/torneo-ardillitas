import type { GalleryPhoto, Match, Team } from "@/lib/types";
import { computeStandingsByGroup } from "@/lib/standings";
import { seedTeams } from "@/lib/teams-seed";
import { mockStandingsByCategory, type StandingsByYear } from "@/lib/standings-data";
import type { TournamentCategorySlug } from "@/lib/tournament-categories";
import { standingsConfig } from "@/lib/tournament-categories";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

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

function mapTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    group: row.group_name,
    category: row.category as TournamentCategorySlug,
    yearLabel: row.year_label,
    logoUrl: null,
  };
}

function seedTeamToTeam(seed: (typeof seedTeams)[number], id: string): Team {
  return {
    id,
    name: seed.name,
    slug: seed.slug,
    group: seed.group,
    category: seed.category,
    yearLabel: seed.yearLabel,
    logoUrl: null,
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
  if (!isSupabaseConfigured()) {
    return seedTeams
      .filter((team) => {
        if (filters?.category && team.category !== filters.category) return false;
        if (filters?.yearLabel && team.yearLabel !== filters.yearLabel) return false;
        return true;
      })
      .map((team, index) => seedTeamToTeam(team, `seed-${team.slug}-${index}`));
  }

  const supabase = createClient();
  let query = supabase
    .from("teams")
    .select("id, name, slug, category, year_label, group_name, sort_order")
    .order("sort_order", { ascending: true });

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.yearLabel) query = query.eq("year_label", filters.yearLabel);

  const { data, error } = await query;
  if (error || !data?.length) {
    return seedTeams
      .filter((team) => {
        if (filters?.category && team.category !== filters.category) return false;
        if (filters?.yearLabel && team.yearLabel !== filters.yearLabel) return false;
        return true;
      })
      .map((team, index) => seedTeamToTeam(team, `seed-${team.slug}-${index}`));
  }

  return (data as TeamRow[]).map(mapTeam);
}

export async function getMatches(filters?: {
  category?: TournamentCategorySlug;
  yearLabel?: string;
}): Promise<Match[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
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
    .select("id, name, slug, category, year_label, group_name, sort_order")
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
  const fallback = mockStandingsByCategory[category];
  const teams = await getTeams({ category });
  const matches = await getMatches({ category });
  const result: StandingsByYear = {};

  for (const yearCategory of standingsConfig[category]) {
    const yearLabel = yearCategory.label;
    const yearTeams = teams.filter((team) => team.yearLabel === yearLabel);
    const yearMatches = matches.filter(
      (match) => match.yearLabel === yearLabel && match.phase === "grupos",
    );

    if (yearTeams.length > 0) {
      result[yearLabel] = computeStandingsByGroup(yearTeams, yearMatches);
      continue;
    }

    result[yearLabel] = fallback[yearLabel] ?? {};
  }

  return result;
}

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
