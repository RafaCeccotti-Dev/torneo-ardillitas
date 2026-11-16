import type { Match } from "@/lib/types";

/** Extrae letra de grupo: prioriza round_label ("Grupo A · …"), luego equipos. */
export function resolveMatchGroup(match: Match): string | null {
  const fromLabel = match.roundLabel?.match(/grupo\s*([a-z0-9]+)/i)?.[1];
  if (fromLabel) return fromLabel.toUpperCase();

  const fromHome = match.homeTeam.group?.trim();
  const fromAway = match.awayTeam.group?.trim();
  if (fromHome && fromAway && fromHome.toUpperCase() === fromAway.toUpperCase()) {
    return fromHome.toUpperCase();
  }
  if (fromHome) return fromHome.toUpperCase();
  if (fromAway) return fromAway.toUpperCase();
  return null;
}

export function groupPhaseMatchesByGroup(
  matches: Match[],
  preferredOrder: string[] = [],
): { group: string; matches: Match[] }[] {
  const map = new Map<string, Match[]>();

  for (const match of matches) {
    const group = resolveMatchGroup(match) ?? "Otros";
    const list = map.get(group) ?? [];
    list.push(match);
    map.set(group, list);
  }

  Array.from(map.values()).forEach((list) => {
    list.sort(
      (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
    );
  });

  const keys = Array.from(map.keys());
  const ordered = [
    ...preferredOrder.filter((g) => map.has(g)),
    ...keys.filter((g) => !preferredOrder.includes(g)).sort(),
  ];

  return ordered.map((group) => ({
    group,
    matches: map.get(group) ?? [],
  }));
}
