import type { Team } from "@/lib/types";

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function clubDisplayName(name: string) {
  return name
    .replace(/\s+"[^"]+"\s*$/g, "")
    .replace(/\s+[ABCD]$/i, "")
    .trim();
}

function slugify(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Mismo club, distinto nombre en el fixture (femenino vs masculino). */
const CLUB_SLUG_ALIASES: Record<string, string> = {
  "central-argentino-olimpico": "central-ceres",
  "club-central-argentino-olimpico": "central-ceres",
  "central-argentino": "central-ceres",
  ccao: "central-ceres",
};

export function clubSlug(team: Pick<Team, "name">) {
  const slug = slugify(clubDisplayName(team.name));
  return CLUB_SLUG_ALIASES[slug] ?? slug;
}

export function teamsForClub(teams: Team[], slug: string) {
  const grouped = teams.filter((team) => clubSlug(team) === slug);
  if (grouped.length > 0) return grouped;

  const seed = teams.find((team) => slugify(team.name) === slug);
  if (!seed) return [];
  return teams.filter((team) => clubSlug(team) === clubSlug(seed));
}
