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
    category: "masculino",
    yearLabel: "2015",
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
    category: "masculino",
    yearLabel: "2015",
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
  {
    id: "p3",
    name: "Escuela Fiscal N° 413",
    description: "Escuela Domingo F. Sarmiento. Av. Tristán Malbrán 24.",
    mapsUrl: "https://maps.google.com/?q=Escuela+413+Domingo+Faustino+Sarmiento+Tristan+Malbran+24+Ceres+Santa+Fe",
  },
  {
    id: "p4",
    name: 'Escuela EETP "Estanislao López"',
    description: "Escuela técnica. Av. Milano 588.",
    mapsUrl: "https://maps.google.com/?q=EETP+453+Estanislao+Lopez+Milano+588+Ceres+Santa+Fe",
  },
  {
    id: "p5",
    name: "Escuela RE",
    description: "Escuela en Ceres.",
    mapsUrl: "https://maps.google.com/?q=Escuela+RE+Ceres+Santa+Fe",
  },
  {
    id: "p6",
    name: "Asociación Noroeste de Básquet",
    description: "Asociación de básquet del noroeste santafesino.",
    mapsUrl: "https://maps.google.com/?q=Asociacion+Noroeste+de+Basquet+Ceres+Santa+Fe",
  },
  {
    id: "p7",
    name: "Liga Ceresina de Fútbol",
    description: "Sede de la liga. Av. Tristán Malbrán 331.",
    mapsUrl: "https://maps.google.com/?q=Liga+Ceresina+de+Futbol+Tristan+Malbran+331+Ceres+Santa+Fe",
  },
  {
    id: "p8",
    name: "Don Balón Eventos",
    description: "Salón de eventos en Ceres.",
    mapsUrl: "https://maps.google.com/?q=Don+Balon+Eventos+Ceres+Santa+Fe",
  },
  {
    id: "p9",
    name: "Escuela Ciclo N° 418",
    description: "Escuela Enseñanza Media 418 Gral. San Martín. Av. Maipú 150.",
    mapsUrl: "https://maps.google.com/?q=Escuela+Media+418+General+San+Martin+Maipu+150+Ceres+Santa+Fe",
  },
  {
    id: "p10",
    name: "Liceo Municipal",
    description: "Liceo municipal de Ceres.",
    mapsUrl: "https://maps.google.com/?q=Liceo+Municipal+Ceres+Santa+Fe",
  },
  {
    id: "p11",
    name: "Escuela Especial",
    description: "Escuela Especial 2039. Remedios Escalada de San Martín 402.",
    mapsUrl: "https://maps.google.com/?q=Escuela+Especial+2039+Ceres+Santa+Fe",
  },
  {
    id: "p12",
    name: "Escuela Nacional",
    description: "Escuela 6124 Pedro de Vega. San Martín 589.",
    mapsUrl: "https://maps.google.com/?q=Escuela+Nacional+6124+Pedro+de+Vega+San+Martin+589+Ceres+Santa+Fe",
  },
  {
    id: "p13",
    name: "Escuela Quilmes",
    description: "Escuela Quilmes en Ceres.",
    mapsUrl: "https://maps.google.com/?q=Escuela+Quilmes+Ceres+Santa+Fe",
  },
  {
    id: "p14",
    name: "Paseo de la Vida",
    description: "Paseo y espacio público en Ceres.",
    mapsUrl: "https://maps.google.com/?q=Paseo+de+la+Vida+Ceres+Santa+Fe",
  },
];

export const clubMapImage = "/backgrounds/croquis-club.png";
export const clubMapPdf = "/club/croquis-ccao.pdf";

