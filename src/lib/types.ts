export type Team = {
  id: string;
  name: string;
  slug: string;
  group: string;
  logoUrl?: string | null;
};

export type MatchPhase = "grupos" | "cruces";

export type Match = {
  id: string;
  phase: MatchPhase;
  roundLabel?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  kickoffAt: string;
  court: string;
  status: "programado" | "en_juego" | "finalizado";
};

export type StandingRow = {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type GalleryPhoto = {
  id: string;
  src: string;
  caption: string;
};

export type CityPlace = {
  id: string;
  name: string;
  description: string;
  mapsUrl: string;
};
