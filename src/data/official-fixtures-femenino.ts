/**
 * Fixture oficial femenino — Word «ultimo FIXTURE FEMENINO ARDILLITAS 2026».
 * Domingo 22 de noviembre 2026 · canchas 7 y 8.
 * En la web: Sub 13 = 2013 · Sub 15 = 2011.
 *
 * Cambio vs fixture anterior: Esc. Raul Toloza pasa de 2011 a 2013.
 * CAS en el Word = Atletico Selva (Club Atlético Selva).
 * Se omite el duplicado Col. Alpina vs R. Toloza de las 18:40 (mismo cruce que 18:00).
 */

export type FemaleGroupMatch = {
  home: string;
  away: string;
  time: string;
  court: number;
  group?: string;
};

export type FemaleBracketMatch = {
  roundLabel: string;
  homeSlot: string;
  awaySlot: string;
  time: string;
  court: number;
};

export type OfficialFemaleFixture = {
  yearLabel: "2013" | "2011";
  teams: string[];
  groups?: Record<string, string[]>;
  aliases: Record<string, string>;
  groupMatches: FemaleGroupMatch[];
  cruces: FemaleBracketMatch[];
};

function aliasMap(entries: Record<string, string>) {
  return entries;
}

const SHARED_ALIASES = aliasMap({
  centra: "Central Argentino Olímpico",
  central: "Central Argentino Olímpico",
  "central argentino": "Central Argentino Olímpico",
  "central argentino olimpico": "Central Argentino Olímpico",
  ccao: "Central Argentino Olímpico",
  "col. alpina": "Colonia Alpina",
  "col alpina": "Colonia Alpina",
  "col, apina": "Colonia Alpina",
  "colonia alpina": "Colonia Alpina",
  warnis: "Warmis Unidas",
  warmis: "Warmis Unidas",
  "warmis unidas": "Warmis Unidas",
  pumas: "Las Pumas",
  "las pumas": "Las Pumas",
  "b° silencio": "Las Pumas",
  "b silencio": "Las Pumas",
  "barrio silencio": "Las Pumas",
  "r toloza": "Esc. Raul Toloza",
  "r. toloza": "Esc. Raul Toloza",
  toloza: "Esc. Raul Toloza",
  "esc. raul toloza": "Esc. Raul Toloza",
  "esc raul toloza": "Esc. Raul Toloza",
  "raul toloza": "Esc. Raul Toloza",
  cas: "Atletico Selva",
  selva: "Atletico Selva",
  "atletico selva": "Atletico Selva",
  "atlético selva": "Atletico Selva",
  "r sayana": "R. Sayana",
  "r. sayana": "R. Sayana",
  sayana: "R. Sayana",
  talleres: "Talleres",
});

export const officialFemaleFixtures: OfficialFemaleFixture[] = [
  {
    yearLabel: "2013",
    teams: [
      "Central Argentino Olímpico",
      "Colonia Alpina",
      "Warmis Unidas",
      "Las Pumas",
      "Esc. Raul Toloza",
    ],
    aliases: SHARED_ALIASES,
    groupMatches: [
      { home: "Central", away: "Col. Alpina", time: "08:00", court: 7 },
      { home: "Warmis", away: "R. Toloza", time: "08:40", court: 8 },
      { home: "Pumas", away: "Central", time: "09:20", court: 7 },
      { home: "Col. Alpina", away: "Warmis", time: "10:00", court: 8 },
      { home: "R. Toloza", away: "Pumas", time: "10:40", court: 7 },
      { home: "Central", away: "Warmis", time: "11:20", court: 8 },
      { home: "Central", away: "R. Toloza", time: "12:00", court: 7 },
      { home: "Col. Alpina", away: "Pumas", time: "12:40", court: 8 },
      { home: "Col Alpina", away: "R. Toloza", time: "18:00", court: 7 },
      { home: "Pumas", away: "Warnis", time: "18:40", court: 8 },
    ],
    cruces: [
      {
        roundLabel: "Copa de Oro · Final · 1° vs 2°",
        homeSlot: "1°",
        awaySlot: "2°",
        time: "21:20",
        court: 7,
      },
      {
        roundLabel: "Copa de Plata · Final · 3° vs 4°",
        homeSlot: "3°",
        awaySlot: "4°",
        time: "21:20",
        court: 8,
      },
    ],
  },
  {
    yearLabel: "2011",
    teams: [
      "Central Argentino Olímpico",
      "Las Pumas",
      "Talleres",
      "Warmis Unidas",
      "R. Sayana",
      "Atletico Selva",
    ],
    groups: {
      A: ["Central Argentino Olímpico", "Las Pumas", "Talleres"],
      B: ["Warmis Unidas", "R. Sayana", "Atletico Selva"],
    },
    aliases: SHARED_ALIASES,
    groupMatches: [
      { home: "Warmis", away: "R. Sayana", time: "08:00", court: 7, group: "B" },
      { home: "Central", away: "Pumas", time: "08:40", court: 8, group: "A" },
      { home: "R. Sayana", away: "CAS", time: "09:20", court: 7, group: "B" },
      { home: "Central", away: "Talleres", time: "10:00", court: 8, group: "A" },
      { home: "Warmis", away: "Cas", time: "10:40", court: 7, group: "B" },
      { home: "Talleres", away: "Pumas", time: "11:20", court: 8, group: "A" },
      { home: "Pumas", away: "R. Sayana", time: "12:00", court: 7, group: "Interzonal" },
      { home: "Central", away: "Warmis", time: "12:40", court: 8, group: "Interzonal" },
      { home: "Talleres", away: "CAS", time: "18:00", court: 7, group: "Interzonal" },
    ],
    cruces: [
      {
        roundLabel: "Copa de Oro · Semifinal · 1° vs 4°",
        homeSlot: "1°",
        awaySlot: "4°",
        time: "19:20",
        court: 7,
      },
      {
        roundLabel: "Copa de Oro · Semifinal · 2° vs 3°",
        homeSlot: "2°",
        awaySlot: "3°",
        time: "19:20",
        court: 8,
      },
      {
        roundLabel: "Copa de Plata · Semifinal · 5° vs Perdedor SF Oro 1",
        homeSlot: "5°",
        awaySlot: "Perdedor SF Oro 1",
        time: "20:40",
        court: 7,
      },
      {
        roundLabel: "Copa de Plata · Semifinal · 6° vs Perdedor SF Oro 2",
        homeSlot: "6°",
        awaySlot: "Perdedor SF Oro 2",
        time: "20:40",
        court: 8,
      },
      {
        roundLabel: "Copa de Oro · Final",
        homeSlot: "Ganador SF Oro 1",
        awaySlot: "Ganador SF Oro 2",
        time: "22:00",
        court: 7,
      },
      {
        roundLabel: "Copa de Plata · Final",
        homeSlot: "Ganador SF Plata 1",
        awaySlot: "Ganador SF Plata 2",
        time: "22:00",
        court: 8,
      },
    ],
  },
];

export function normalizeFemaleKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[°º]/g, "")
    .replace(/[“”"']/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveFemaleName(fixture: OfficialFemaleFixture, raw: string) {
  const key = normalizeFemaleKey(raw);
  const aliases = new Map(
    Object.entries(fixture.aliases).map(([alias, name]) => [normalizeFemaleKey(alias), name]),
  );
  return aliases.get(key) ?? fixture.teams.find((name) => normalizeFemaleKey(name) === key) ?? null;
}

export const femaleFormatNotes: Record<string, string> = {
  "2013":
    "5 equipos · todos contra todos. Clasificación por tabla general. Final de Oro: 1° vs 2°. Final de Plata: 3° vs 4°. El 5° queda eliminado.",
  "2011":
    "6 equipos · Grupo A y Grupo B más interzonales. Clasificación por tabla general. Semis de Oro: 1° vs 4° y 2° vs 3°. Semis de Plata: 5° vs perdedor de la semi Oro 1, y 6° vs perdedor de la semi Oro 2. Finales Oro y Plata: ganador vs ganador.",
};
