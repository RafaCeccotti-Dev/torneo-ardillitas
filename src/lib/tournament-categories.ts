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
  /** Texto en el picker si no es el año a secas. */
  displayName?: string;
  /** Una sola tabla, sin zonas de grupos. */
  singleTable?: boolean;
};

export const standingsConfig: Record<TournamentCategorySlug, YearStandingsConfig[]> = {
  masculino: [
    { label: "2015", groups: ["A", "B", "C"] },
    { label: "2016", groups: ["A", "B", "C"] },
    { label: "2017", groups: ["A", "B", "C", "D"] },
    { label: "2018", groups: ["A", "B", "C"] },
    { label: "2019/2020", groups: ["A", "B", "C", "D"] },
  ],
  femenino: [
    { label: "2011", groups: ["A", "B"] },
    { label: "2013", groups: ["A"], singleTable: true },
  ],
};

export function yearConfig(category: TournamentCategorySlug, label: string) {
  return standingsConfig[category].find((item) => item.label === label);
}

export function yearDisplayName(category: TournamentCategorySlug, label: string) {
  return yearConfig(category, label)?.displayName ?? label;
}

export function isTournamentCategorySlug(value: string): value is TournamentCategorySlug {
  return tournamentCategories.some((category) => category.slug === value);
}

/** "2019/2020" → "2019-2020" (seguro para URLs) */
export function yearLabelToSlug(label: string): string {
  return label.replace(/\//g, "-");
}

export function resolveYearLabel(
  slugOrLabel: string,
  category: TournamentCategorySlug,
  extraLabels: string[] = [],
): string | null {
  const decoded = decodeURIComponent(slugOrLabel);
  if (category === "femenino" && (decoded === "2015" || decoded === "2015-sub-15")) {
    return "2011";
  }
  const known = [
    ...standingsConfig[category].map((item) => item.label),
    ...extraLabels,
  ];
  const exact = known.find((label) => label === decoded || yearLabelToSlug(label) === decoded);
  return exact ?? null;
}

export function listYearLabels(
  category: TournamentCategorySlug,
  extraLabels: string[] = [],
): string[] {
  const fromConfig = standingsConfig[category].map((item) => item.label);
  const extras = extraLabels
    .map((label) => (category === "femenino" && label === "2015" ? "2011" : label))
    .filter((label) => !fromConfig.includes(label));
  return [...fromConfig, ...extras.sort()];
}

export const yearToSlug = yearLabelToSlug;

export function yearFromSlug(categoria: TournamentCategorySlug, slug: string) {
  return resolveYearLabel(slug, categoria) ?? slug;
}

export function yearsForCategory(categoria: TournamentCategorySlug, extraYears: string[] = []) {
  return listYearLabels(categoria, extraYears);
}
