export const tournamentCategories = [
  {
    slug: "masculino",
    title: "Fútbol masculino",
    description: "Tablas por categoría de nacimiento y grupos del torneo.",
  },
  {
    slug: "femenino",
    title: "Fútbol femenino",
    description: "Tablas por categoría de nacimiento y grupos del torneo.",
  },
] as const;

export type TournamentCategorySlug = (typeof tournamentCategories)[number]["slug"];

export type YearStandingsConfig = {
  label: string;
  groups: string[];
};

export const standingsConfig: Record<TournamentCategorySlug, YearStandingsConfig[]> = {
  masculino: [
    { label: "2015", groups: ["A", "B", "C"] },
    { label: "2016", groups: ["A", "B", "C"] },
    { label: "2017", groups: ["A", "B", "C"] },
    { label: "2018", groups: ["A", "B", "C"] },
    { label: "2019/2020", groups: ["A", "B", "C"] },
  ],
  femenino: [
    { label: "2011", groups: ["A", "B", "C"] },
    { label: "2014", groups: ["A", "B", "C"] },
    { label: "2016", groups: ["A", "B", "C"] },
  ],
};

export function isTournamentCategorySlug(value: string): value is TournamentCategorySlug {
  return tournamentCategories.some((category) => category.slug === value);
}
