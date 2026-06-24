import type { CityPlace, GalleryPhoto, Match, StandingRow, Team } from "./types";

const teams: Team[] = [
  {
    id: "1",
    name: "Ardillitas A",
    slug: "ardillitas-a",
    group: "A",
    logoUrl: null,
  },
  {
    id: "2",
    name: "Sportivo Norte",
    slug: "sportivo-norte",
    group: "A",
    logoUrl: null,
  },
  {
    id: "3",
    name: "Juventud FC",
    slug: "juventud-fc",
    group: "B",
    logoUrl: null,
  },
  {
    id: "4",
    name: "Defensores Sur",
    slug: "defensores-sur",
    group: "B",
    logoUrl: null,
  },
];

export const mockTeams = teams;

export const mockMatches: Match[] = [
  {
    id: "m1",
    phase: "grupos",
    homeTeam: teams[0],
    awayTeam: teams[1],
    homeScore: 2,
    awayScore: 1,
    kickoffAt: "2026-06-28T15:00:00",
    court: "Cancha 1",
    status: "finalizado",
  },
  {
    id: "m2",
    phase: "grupos",
    homeTeam: teams[2],
    awayTeam: teams[3],
    kickoffAt: "2026-06-28T17:00:00",
    court: "Cancha 2",
    status: "programado",
  },
];

export const mockStandings: Record<string, StandingRow[]> = {
  A: [
    {
      team: teams[0],
      played: 1,
      won: 1,
      drawn: 0,
      lost: 0,
      goalsFor: 2,
      goalsAgainst: 1,
      points: 3,
    },
    {
      team: teams[1],
      played: 1,
      won: 0,
      drawn: 0,
      lost: 1,
      goalsFor: 1,
      goalsAgainst: 2,
      points: 0,
    },
  ],
  B: [
    {
      team: teams[2],
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    },
    {
      team: teams[3],
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    },
  ],
};

export const mockGallery: GalleryPhoto[] = [];

export const mockPlaces: CityPlace[] = [
  {
    id: "p1",
    name: "Terminal de ómnibus",
    description: "Llegada desde otras localidades.",
    mapsUrl: "https://maps.google.com/?q=Terminal+de+omnibus+Ceres+Santa+Fe",
  },
  {
    id: "p2",
    name: "Hospital local",
    description: "Urgencias y guardia.",
    mapsUrl: "https://maps.google.com/?q=Hospital+Ceres+Santa+Fe",
  },
];

export const clubMapImage = "/backgrounds/plano-club.jpeg";

export const regulation = {
  pdfUrl: "/reglamento/reglamento.pdf",
  text: `Reglamento provisorio del torneo.

1. Cada equipo presentará lista de buena fe antes del primer partido.
2. Los partidos se jugarán en las canchas del club según fixture publicado.
3. En fase de grupos se otorgan 3 puntos por victoria, 1 por empate.
4. El fair play es obligatorio: expulsiones pueden implicar sanción de fechas.

El PDF definitivo lo subirá el coordinador desde el panel de administración.`,
};
