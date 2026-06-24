export const tournamentCategories = [
  {
    slug: "masculino",
    title: "Fútbol masculino",
    description: "Tabla de posiciones del torneo masculino.",
  },
  {
    slug: "femenino",
    title: "Fútbol femenino",
    description: "Tabla de posiciones del torneo femenino.",
  },
] as const;

export type TournamentCategorySlug = (typeof tournamentCategories)[number]["slug"];

export function isTournamentCategorySlug(value: string): value is TournamentCategorySlug {
  return tournamentCategories.some((category) => category.slug === value);
}
