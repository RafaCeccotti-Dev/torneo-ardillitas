import type { TournamentCategorySlug } from "@/lib/tournament-categories";

export type SeedTeam = {
  name: string;
  slug: string;
  category: TournamentCategorySlug;
  yearLabel: string;
  group: string;
};

export const seedTeams: SeedTeam[] = [
  { name: "ATLETICO CERES A", slug: "atletico-ceres-a", category: "masculino", yearLabel: "2015", group: "A" },
  { name: "CENTRAL ARGENTINO A", slug: "central-argentino-a", category: "masculino", yearLabel: "2015", group: "A" },
  { name: "CLUB ATLETICO TOSTADO A", slug: "club-atletico-tostado-a", category: "masculino", yearLabel: "2015", group: "A" },
  { name: "UNION Y JUVENTUD DE BANDERA A", slug: "union-juventud-bandera-a", category: "masculino", yearLabel: "2015", group: "A" },
  { name: "ATLETICO CERES B", slug: "atletico-ceres-b", category: "masculino", yearLabel: "2015", group: "B" },
  { name: "CENTRAL ARGENTINO B", slug: "central-argentino-b", category: "masculino", yearLabel: "2015", group: "B" },
  { name: "CLUB ATLETICO TOSTADO B", slug: "club-atletico-tostado-b", category: "masculino", yearLabel: "2015", group: "B" },
  { name: "UNION Y JUVENTUD DE BANDERA B", slug: "union-juventud-bandera-b", category: "masculino", yearLabel: "2015", group: "B" },
  { name: "SAN LORENZO DE TOSTADO A", slug: "san-lorenzo-tostado-a", category: "masculino", yearLabel: "2015", group: "C" },
  { name: "LEONCITAS", slug: "leoncitas", category: "masculino", yearLabel: "2015", group: "C" },
  { name: "CLUB ATLETICO CERES", slug: "club-atletico-ceres", category: "masculino", yearLabel: "2015", group: "C" },
];
