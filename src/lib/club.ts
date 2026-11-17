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

export function clubSlug(team: Pick<Team, "name">) {
  return slugify(clubDisplayName(team.name));
}

export function teamsForClub(teams: Team[], slug: string) {
  const grouped = teams.filter((team) => clubSlug(team) === slug);
  if (grouped.length > 0) return grouped;

  const seed = teams.find((team) => slugify(team.name) === slug);
  if (!seed) return [];
  return teams.filter((team) => clubSlug(team) === clubSlug(seed));
}
