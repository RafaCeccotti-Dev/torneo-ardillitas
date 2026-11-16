/**
 * Fixture oficial masculino 2015 / 2016 / 2017 (fase de grupos + estructura de cruces).
 * Fechas del torneo: 21 (sábado), 22 (domingo) y 23 (lunes) de noviembre 2026.
 */

export type OfficialGroupMatch = {
  home: string;
  away: string;
  day: "sabado" | "domingo";
  time: string;
  court: number;
  group: string;
};

export type OfficialBracketMatch = {
  roundLabel: string;
  homeSlot: string;
  awaySlot: string;
  time: string;
  court: number;
};

export type OfficialYearFixture = {
  yearLabel: string;
  groups: Record<string, string[]>;
  /** Alias PDF → nombre exacto en DB */
  aliases: Record<string, string>;
  groupMatches: OfficialGroupMatch[];
  oro: OfficialBracketMatch[];
  plata: OfficialBracketMatch[];
};

const SAT = "sabado" as const;
const SUN = "domingo" as const;

export const officialFixtures: OfficialYearFixture[] = [
  {
    yearLabel: "2015",
    groups: {
      A: ["Argentinos Jrs", "Sportivo Norte de Rafaela", 'Central Ceres "Amarillo"', "A.D.Malbran"],
      B: ["Quilmes BS AS", "Atletico Selva", "Barrio 9 de Julio", 'Atletico Ceres "Azul"'],
      C: ['Central Ceres "Negro"', "9 de Julio de Rafaela", 'Atletico Ceres "Rojo"', "Union de Hersilia"],
    },
    aliases: {
      "argentinos jrs": "Argentinos Jrs",
      "argentinos jrs.": "Argentinos Jrs",
      "sportivo norte raf": "Sportivo Norte de Rafaela",
      "sportivo norte de rafaela": "Sportivo Norte de Rafaela",
      'ccao "amarillo"': 'Central Ceres "Amarillo"',
      'central ceres "amarillo"': 'Central Ceres "Amarillo"',
      "a.d. malbran": "A.D.Malbran",
      "a.d malbran": "A.D.Malbran",
      "a.d.malbran": "A.D.Malbran",
      "ad malbran": "A.D.Malbran",
      "quilmes bs as": "Quilmes BS AS",
      "atletico selva": "Atletico Selva",
      "b. 9 de julio ceres": "Barrio 9 de Julio",
      "barrio 9 de julio": "Barrio 9 de Julio",
      "barrio 9 de julio ceres": "Barrio 9 de Julio",
      'cacu "azul"': 'Atletico Ceres "Azul"',
      'atletico ceres "azul"': 'Atletico Ceres "Azul"',
      'ccao "negro"': 'Central Ceres "Negro"',
      'central ceres "negro"': 'Central Ceres "Negro"',
      "9 de julio raf": "9 de Julio de Rafaela",
      "9 de julio de rafaela": "9 de Julio de Rafaela",
      'cacu "rojo"': 'Atletico Ceres "Rojo"',
      'atletico ceres "rojo"': 'Atletico Ceres "Rojo"',
      "union hersilia": "Union de Hersilia",
      "unión hersilia": "Union de Hersilia",
      "union de hersilia": "Union de Hersilia",
    },
    groupMatches: [
      { home: 'CCAO "Negro"', away: "Union Hersilia", day: SAT, time: "09:20", court: 1, group: "C" },
      { home: "B. 9 de Julio Ceres", away: 'CACU "Azul"', day: SAT, time: "10:00", court: 1, group: "B" },
      { home: "9 de Julio Raf", away: 'CACU "Rojo"', day: SAT, time: "10:40", court: 1, group: "C" },
      { home: "A.D. Malbran", away: 'CCAO "Amarillo"', day: SAT, time: "10:40", court: 6, group: "A" },
      { home: "Union Hersilia", away: 'CACU "Rojo"', day: SAT, time: "12:00", court: 6, group: "C" },
      { home: 'CCAO "Negro"', away: "9 de Julio Raf", day: SAT, time: "18:40", court: 1, group: "C" },
      { home: "Argentinos Jrs", away: "A.D. Malbran", day: SAT, time: "18:40", court: 6, group: "A" },
      { home: "Atletico Selva", away: "B. 9 de Julio Ceres", day: SAT, time: "19:20", court: 1, group: "B" },
      { home: "Quilmes BS AS", away: 'CACU "Azul"', day: SAT, time: "19:20", court: 6, group: "B" },
      { home: "Sportivo Norte Raf", away: "A.D. Malbran", day: SUN, time: "08:00", court: 6, group: "A" },
      { home: "Sportivo Norte Raf", away: 'CCAO "Amarillo"', day: SUN, time: "09:20", court: 1, group: "A" },
      { home: "Quilmes BS AS", away: "B. 9 de Julio Ceres", day: SUN, time: "10:00", court: 6, group: "B" },
      { home: "9 de Julio Raf", away: "Union Hersilia", day: SUN, time: "10:40", court: 1, group: "C" },
      { home: 'CCAO "Negro"', away: 'CACU "Rojo"', day: SUN, time: "10:40", court: 6, group: "C" },
      { home: 'CCAO "Amarillo"', away: "Argentinos Jrs", day: SUN, time: "11:20", court: 6, group: "A" },
      { home: "Quilmes BS AS", away: "Atletico Selva", day: SUN, time: "18:40", court: 6, group: "B" },
      { home: "Atletico Selva", away: 'CACU "Azul"', day: SUN, time: "20:00", court: 1, group: "B" },
      { home: "Sportivo Norte Raf", away: "Argentinos Jrs", day: SUN, time: "20:00", court: 6, group: "A" },
    ],
    // 3 grupos: mejores 1° vs 3° clasificados; peor 1° vs peor 2°; 2° restantes entre sí
    oro: [
      { roundLabel: "Copa de Oro · Cuartos · Mejor 1° vs Mejor 3°", homeSlot: "Mejor 1°", awaySlot: "Mejor 3°", time: "09:00", court: 1 },
      { roundLabel: "Copa de Oro · Cuartos · 2° mejor 1° vs 2° mejor 3°", homeSlot: "2° mejor 1°", awaySlot: "2° mejor 3°", time: "09:40", court: 2 },
      { roundLabel: "Copa de Oro · Cuartos · Peor 1° vs Peor 2°", homeSlot: "Peor 1°", awaySlot: "Peor 2°", time: "10:20", court: 3 },
      { roundLabel: "Copa de Oro · Cuartos · 2° restantes", homeSlot: "Mejor 2°", awaySlot: "2° mejor 2°", time: "11:00", court: 4 },
    ],
    plata: [
      { roundLabel: "Copa de Plata · Semis · 3° restante vs 4° A", homeSlot: "3° restante", awaySlot: "4° Grupo A", time: "15:00", court: 1 },
      { roundLabel: "Copa de Plata · Semis · 4° B vs 4° C", homeSlot: "4° Grupo B", awaySlot: "4° Grupo C", time: "15:40", court: 2 },
    ],
  },
  {
    yearLabel: "2016",
    groups: {
      A: [
        "Velez Sarsfield",
        "Cultural La Para",
        "Independiente de San Cristobal",
        "Mitre de Esperanza",
        'Sportivo Norte de Rafaela "Blanco"',
      ],
      B: [
        "Argentinos Jrs",
        "Atletico Ceres",
        'Sportivo Norte de Rafaela "Azul"',
        "Atletico Selva",
        "9 de Julio de Rafaela",
      ],
      C: [
        "Central Ceres",
        "Las Palmeras",
        "Mascotas de Tostado",
        "SL de Tostado",
        "Leones Selvenses",
      ],
    },
    aliases: {
      "velez sarsfield": "Velez Sarsfield",
      "cultural la para": "Cultural La Para",
      "ind. san cristobal": "Independiente de San Cristobal",
      "independiente de san cristobal": "Independiente de San Cristobal",
      "mitre esperanza": "Mitre de Esperanza",
      "mitre de esperanza": "Mitre de Esperanza",
      'sp norte raf "blanco"': 'Sportivo Norte de Rafaela "Blanco"',
      'sportivo norte "blanco"': 'Sportivo Norte de Rafaela "Blanco"',
      'sportivo norte de rafaela "blanco"': 'Sportivo Norte de Rafaela "Blanco"',
      "argentinos jrs": "Argentinos Jrs",
      cacu: "Atletico Ceres",
      "atletico ceres": "Atletico Ceres",
      'sp norte raf "azul"': 'Sportivo Norte de Rafaela "Azul"',
      'sp. norte raf "azul"': 'Sportivo Norte de Rafaela "Azul"',
      'sportivo norte "azul"': 'Sportivo Norte de Rafaela "Azul"',
      'sportivo norte de rafaela "azul"': 'Sportivo Norte de Rafaela "Azul"',
      "atletico selva": "Atletico Selva",
      "atlético selva": "Atletico Selva",
      "9 de julio raf": "9 de Julio de Rafaela",
      "9 de julio rafaela": "9 de Julio de Rafaela",
      "9 de julio de rafaela": "9 de Julio de Rafaela",
      ccao: "Central Ceres",
      "central ceres": "Central Ceres",
      "las palmeras": "Las Palmeras",
      "mascotas tostado": "Mascotas de Tostado",
      "mascotas de tostado": "Mascotas de Tostado",
      "sl tostado": "SL de Tostado",
      "sl de tostado": "SL de Tostado",
      "san lorenzo de tostado": "SL de Tostado",
      "leones selvenses": "Leones Selvenses",
    },
    groupMatches: [
      { home: "Las Palmeras", away: "SL Tostado", day: SAT, time: "08:00", court: 2, group: "C" },
      { home: "Argentinos Jrs", away: "9 de Julio Rafaela", day: SAT, time: "08:40", court: 4, group: "B" },
      { home: "Las Palmeras", away: "Leones Selvenses", day: SAT, time: "09:20", court: 4, group: "C" },
      { home: "SL Tostado", away: "Mascotas Tostado", day: SAT, time: "10:00", court: 2, group: "C" },
      { home: "Las Palmeras", away: "CCAO", day: SAT, time: "10:40", court: 2, group: "C" },
      { home: "Las Palmeras", away: "Mascotas Tostado", day: SAT, time: "12:00", court: 4, group: "C" },
      { home: "Leones Selvenses", away: "SL Tostado", day: SAT, time: "18:00", court: 2, group: "C" },
      { home: "Argentinos Jrs", away: "Atletico Selva", day: SAT, time: "18:00", court: 4, group: "B" },
      { home: "CACU", away: "9 de Julio Rafaela", day: SAT, time: "19:20", court: 2, group: "B" },
      { home: "CCAO", away: "SL Tostado", day: SAT, time: "20:00", court: 4, group: "C" },
      { home: "CACU", away: "Atletico Selva", day: SAT, time: "22:00", court: 4, group: "B" },
      { home: "Cultural La Para", away: "Mitre Esperanza", day: SUN, time: "08:00", court: 2, group: "A" },
      { home: "Velez Sarsfield", away: 'SP Norte Raf "Blanco"', day: SUN, time: "08:00", court: 4, group: "A" },
      { home: "Cultural La Para", away: "Ind. San Cristobal", day: SUN, time: "09:20", court: 4, group: "A" },
      { home: "Mascotas Tostado", away: "Leones Selvenses", day: SUN, time: "10:00", court: 2, group: "C" },
      { home: 'SP Norte Raf "Azul"', away: "Argentinos Jrs", day: SUN, time: "10:00", court: 4, group: "B" },
      { home: "Ind. San Cristobal", away: "Velez Sarsfield", day: SUN, time: "10:40", court: 2, group: "A" },
      { home: 'SP Norte Raf "Blanco"', away: "Cultural La Para", day: SUN, time: "10:40", court: 4, group: "A" },
      { home: 'SP Norte Raf "Azul"', away: "CACU", day: SUN, time: "12:00", court: 2, group: "B" },
      { home: "CCAO", away: "Leones Selvenses", day: SUN, time: "12:00", court: 4, group: "C" },
      { home: "Mitre Esperanza", away: "Ind. San Cristobal", day: SUN, time: "18:00", court: 2, group: "A" },
      { home: 'SP Norte Raf "Azul"', away: "Atletico Selva", day: SUN, time: "18:00", court: 4, group: "B" },
      { home: "CCAO", away: "Mascotas Tostado", day: SUN, time: "18:40", court: 2, group: "C" },
      { home: "Atletico Selva", away: "9 de Julio Rafaela", day: SUN, time: "19:20", court: 4, group: "B" },
      { home: "Ind. San Cristobal", away: 'SP Norte Raf "Blanco"', day: SUN, time: "20:00", court: 2, group: "A" },
      { home: "Velez Sarsfield", away: "Mitre Esperanza", day: SUN, time: "20:00", court: 4, group: "A" },
      { home: "CACU", away: "Argentinos Jrs", day: SUN, time: "20:40", court: 2, group: "B" },
      { home: 'SP. Norte Raf "Azul"', away: "9 de Julio Rafaela", day: SUN, time: "20:40", court: 4, group: "B" },
      { home: "Velez Sarsfield", away: "Cultural La Para", day: SUN, time: "22:00", court: 2, group: "A" },
      { home: "Mitre Esperanza", away: 'SP Norte Raf "Blanco"', day: SUN, time: "22:00", court: 4, group: "A" },
    ],
    oro: [
      { roundLabel: "Copa de Oro · Cuartos · Mejor 1° vs Mejor 3°", homeSlot: "Mejor 1°", awaySlot: "Mejor 3°", time: "09:00", court: 1 },
      { roundLabel: "Copa de Oro · Cuartos · 2° mejor 1° vs 2° mejor 3°", homeSlot: "2° mejor 1°", awaySlot: "2° mejor 3°", time: "09:40", court: 2 },
      { roundLabel: "Copa de Oro · Cuartos · Peor 1° vs Peor 2°", homeSlot: "Peor 1°", awaySlot: "Peor 2°", time: "10:20", court: 3 },
      { roundLabel: "Copa de Oro · Cuartos · 2° restantes", homeSlot: "Mejor 2°", awaySlot: "2° mejor 2°", time: "11:00", court: 4 },
    ],
    plata: [
      { roundLabel: "Copa de Plata · Cuartos · 3° restante vs 4° A", homeSlot: "3° restante", awaySlot: "4° Grupo A", time: "15:00", court: 1 },
      { roundLabel: "Copa de Plata · Cuartos · 4° B vs 5° A", homeSlot: "4° Grupo B", awaySlot: "5° Grupo A", time: "15:40", court: 2 },
      { roundLabel: "Copa de Plata · Cuartos · 4° C vs 5° B", homeSlot: "4° Grupo C", awaySlot: "5° Grupo B", time: "16:20", court: 3 },
      { roundLabel: "Copa de Plata · Cuartos · 5° C vs Mejor perdedor Oro", homeSlot: "5° Grupo C", awaySlot: "Mejor perdedor 1er cruce Oro", time: "17:00", court: 4 },
    ],
  },
  {
    yearLabel: "2017",
    groups: {
      A: ["Quilmes BS AS", 'Central Ceres "Negro"', "Atletico de Tostado", "Esc. Raul Toloza"],
      B: ["Rosario Central", "Independiente de San Cristobal", "C U D Arrufo", "Barrio 9 de Julio"],
      C: ["Atletico de Rafaela", "Atletico Ceres", "Libertad de Sunchales", "Ben Hur de Rafaela"],
      D: ["Lanus", "Atletico Selva", 'Central Ceres "Amarillo"', "Barrio Quilmes"],
    },
    aliases: {
      "quilmes bs as": "Quilmes BS AS",
      'ccao "negro"': 'Central Ceres "Negro"',
      'central ceres "negro"': 'Central Ceres "Negro"',
      "atletico tostado": "Atletico de Tostado",
      "atletico de tostado": "Atletico de Tostado",
      "esc. raul toloza": "Esc. Raul Toloza",
      "rosario central": "Rosario Central",
      "ind. san cristobal": "Independiente de San Cristobal",
      "independiente de san cristobal": "Independiente de San Cristobal",
      cuda: "C U D Arrufo",
      "c.u.d arrufo": "C U D Arrufo",
      "c u d arrufo": "C U D Arrufo",
      "b. 9 de julio ceres": "Barrio 9 de Julio",
      "barrio 9 de julio": "Barrio 9 de Julio",
      "atletico rafaela": "Atletico de Rafaela",
      "atletico de rafaela": "Atletico de Rafaela",
      cacu: "Atletico Ceres",
      "atletico ceres": "Atletico Ceres",
      "libertad sunchales": "Libertad de Sunchales",
      "libertad de sunchales": "Libertad de Sunchales",
      "ben hur rafaela": "Ben Hur de Rafaela",
      "ben hur de rafaela": "Ben Hur de Rafaela",
      lanus: "Lanus",
      "atletico selva": "Atletico Selva",
      'ccao "amarillo"': 'Central Ceres "Amarillo"',
      'central ceres "amarillo"': 'Central Ceres "Amarillo"',
      "barrio quilmes": "Barrio Quilmes",
    },
    groupMatches: [
      { home: "Ind. San Cristobal", away: "CUDA", day: SAT, time: "08:00", court: 4, group: "B" },
      { home: "Lanus", away: "Barrio Quilmes", day: SAT, time: "08:40", court: 2, group: "D" },
      { home: 'CCAO "Amarillo"', away: "Atletico Selva", day: SAT, time: "09:20", court: 2, group: "D" },
      { home: "Rosario Central", away: "CUDA", day: SAT, time: "10:00", court: 4, group: "B" },
      { home: "Ind. San Cristobal", away: "B. 9 de Julio Ceres", day: SAT, time: "11:20", court: 4, group: "B" },
      { home: "Barrio Quilmes", away: "Atletico Selva", day: SAT, time: "12:00", court: 2, group: "D" },
      { home: "CUDA", away: "B. 9 de Julio Ceres", day: SAT, time: "18:40", court: 2, group: "B" },
      { home: "Lanus", away: 'CCAO "Amarillo"', day: SAT, time: "18:40", court: 4, group: "D" },
      { home: "Rosario Central", away: "Ind. San Cristobal", day: SAT, time: "19:20", court: 4, group: "B" },
      { home: 'CCAO "Negro"', away: "Quilmes BS AS", day: SAT, time: "20:00", court: 2, group: "A" },
      { home: "Atletico Rafaela", away: "CACU", day: SAT, time: "22:40", court: 4, group: "C" },
      { home: "Atletico Tostado", away: "Esc. Raul Toloza", day: SUN, time: "08:40", court: 2, group: "A" },
      { home: "Libertad Sunchales", away: "Ben Hur Rafaela", day: SUN, time: "08:40", court: 4, group: "C" },
      { home: 'CCAO "Amarillo"', away: "Barrio Quilmes", day: SUN, time: "09:20", court: 2, group: "D" },
      { home: "Atletico Tostado", away: 'CCAO "Negro"', day: SUN, time: "11:20", court: 2, group: "A" },
      { home: "Esc. Raul Toloza", away: "Quilmes BS AS", day: SUN, time: "11:20", court: 4, group: "A" },
      { home: "Libertad Sunchales", away: "CACU", day: SUN, time: "12:40", court: 2, group: "C" },
      { home: "Atletico Rafaela", away: "Ben Hur Rafaela", day: SUN, time: "12:40", court: 4, group: "C" },
      { home: "Atletico Tostado", away: "Quilmes BS AS", day: SUN, time: "18:40", court: 2, group: "A" },
      { home: "Esc. Raul Toloza", away: 'CCAO "Negro"', day: SUN, time: "19:20", court: 2, group: "A" },
      { home: "Ben Hur Rafaela", away: "CACU", day: SUN, time: "21:20", court: 2, group: "C" },
      { home: "Rosario Central", away: "B. 9 de Julio Ceres", day: SUN, time: "21:20", court: 4, group: "B" },
      { home: "Atletico Selva", away: "Lanus", day: SUN, time: "22:40", court: 2, group: "D" },
      { home: "Libertad Sunchales", away: "Atletico Rafaela", day: SUN, time: "22:40", court: 4, group: "C" },
    ],
    // 4 grupos: 1A vs 2B, 1B vs 2A, 1C vs 2D, 1D vs 2C
    oro: [
      { roundLabel: "Copa de Oro · Cuartos · 1°A vs 2°B", homeSlot: "1° Grupo A", awaySlot: "2° Grupo B", time: "09:00", court: 1 },
      { roundLabel: "Copa de Oro · Cuartos · 1°B vs 2°A", homeSlot: "1° Grupo B", awaySlot: "2° Grupo A", time: "09:40", court: 2 },
      { roundLabel: "Copa de Oro · Cuartos · 1°C vs 2°D", homeSlot: "1° Grupo C", awaySlot: "2° Grupo D", time: "10:20", court: 3 },
      { roundLabel: "Copa de Oro · Cuartos · 1°D vs 2°C", homeSlot: "1° Grupo D", awaySlot: "2° Grupo C", time: "11:00", court: 4 },
    ],
    plata: [
      { roundLabel: "Copa de Plata · Cuartos · 3°A vs 4°B", homeSlot: "3° Grupo A", awaySlot: "4° Grupo B", time: "15:00", court: 1 },
      { roundLabel: "Copa de Plata · Cuartos · 3°B vs 4°A", homeSlot: "3° Grupo B", awaySlot: "4° Grupo A", time: "15:40", court: 2 },
      { roundLabel: "Copa de Plata · Cuartos · 3°C vs 4°D", homeSlot: "3° Grupo C", awaySlot: "4° Grupo D", time: "16:20", court: 3 },
      { roundLabel: "Copa de Plata · Cuartos · 3°D vs 4°C", homeSlot: "3° Grupo D", awaySlot: "4° Grupo C", time: "17:00", court: 4 },
    ],
  },
];

export function normalizeTeamKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[“”"']/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
