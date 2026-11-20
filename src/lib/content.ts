import { clubSlug } from "@/lib/club";
import type { GalleryPhoto, Match, Team } from "@/lib/types";
import { isPlaceholderTeamName } from "@/lib/knockout";
import { splitRoundAndPens } from "@/lib/penalties";
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

function remapFemaleYear(category: string, yearLabel: string) {
  return category === "femenino" && yearLabel === "2015" ? "2011" : yearLabel;
}

function stripFemaleSubLabel(value: string) {
  return value.replace(/\s*Sub\s*1[35]\b/gi, "").replace(/\s{2,}/g, " ").trim();
}

function publicLogoUrl(logoPath: string | null | undefined): string | null {
  if (!logoPath || !isSupabaseConfigured()) return null;
  const supabase = createPublicClient();
  return supabase.storage.from("escudos").getPublicUrl(logoPath).data.publicUrl;
}

function mapTeam(row: TeamRow, logos?: Map<string, string>): Team {
  const name = row.category === "femenino" ? stripFemaleSubLabel(row.name) : row.name;
  const ownLogo = publicLogoUrl(row.logo_path);
  const shared =
    !ownLogo && row.group_name !== "PEND" && !isPlaceholderTeamName(name)
      ? logos?.get(clubSlug({ name })) ?? null
      : null;
  return {
    id: row.id,
    name,
    slug: row.slug,
    group: row.group_name,
    category: row.category as TournamentCategorySlug,
    yearLabel: remapFemaleYear(row.category, row.year_label),
    logoUrl: ownLogo ?? shared,
  };
}

async function clubLogoMap(
  supabase: ReturnType<typeof createPublicClient>,
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("teams")
    .select("name, group_name, logo_path")
    .not("logo_path", "is", null);
  const logos = new Map<string, string>();
  for (const row of data ?? []) {
    if (!row.logo_path || row.group_name === "PEND" || isPlaceholderTeamName(row.name)) continue;
    const slug = clubSlug({ name: row.name });
    if (logos.has(slug)) continue;
    const url = publicLogoUrl(row.logo_path);
    if (url) logos.set(slug, url);
  }
  return logos;
}

function buildMatch(row: MatchRow, home: Team, away: Team): Match {
  const parsed = splitRoundAndPens(row.round_label);
  const roundLabel =
    row.category === "femenino" && parsed.roundLabel
      ? stripFemaleSubLabel(parsed.roundLabel)
      : parsed.roundLabel;
  return {
    id: row.id,
    category: row.category as TournamentCategorySlug,
    yearLabel: remapFemaleYear(row.category, row.year_label),
    phase: row.phase,
    roundLabel: roundLabel ?? undefined,
    homeTeam: home,
    awayTeam: away,
    homeScore: row.home_score,
    awayScore: row.away_score,
    homePenalties: parsed.homePenalties,
    awayPenalties: parsed.awayPenalties,
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

  const logos = await clubLogoMap(supabase);
  return (data as unknown as TeamRow[]).map((row) => mapTeam(row, logos));
}

export async function getMatches(filters?: {
  category?: TournamentCategorySlug;
  yearLabel?: string;
}): Promise<Match[]> {
  if (!isSupabaseConfigured()) return [];

  // Fixture visible salvo que se oculte explícitamente (PUBLISH_FIXTURE=false).
  // Antes estaba oculto por defecto para no mostrar datos de prueba.
  const publishFixture = process.env.PUBLISH_FIXTURE !== "false";
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
  const rows = (!error && matchRows?.length ? matchRows : []) as MatchRow[];
  if (!rows.length) return [];

  const teamIds = Array.from(
    new Set(rows.flatMap((row) => [row.home_team_id, row.away_team_id])),
  );

  const { data: teamRows, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, slug, category, year_label, group_name, sort_order, logo_path")
    .in("id", teamIds);

  if (teamsError || !teamRows?.length) return [];

  const logos = await clubLogoMap(supabase);
  const teamMap = new Map(
    (teamRows as TeamRow[]).map((row) => [row.id, mapTeam(row, logos)] as const),
  );

  return rows
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
    const yearTeams = teams.filter(
      (team) =>
        team.yearLabel === yearLabel &&
        team.group &&
        team.group.toUpperCase() !== "PEND",
    );
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
