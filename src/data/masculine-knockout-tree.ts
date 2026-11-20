import type { OfficialBracketMatch } from "@/data/official-fixtures-2015-2017";

/** Semis + final de Oro, después de 4 cuartos. El mejor ganador juega contra el peor. */
export const oroAfterCuartos: OfficialBracketMatch[] = [
  {
    roundLabel: "Copa de Oro · Semifinal · Mejor ganador vs Peor ganador",
    homeSlot: "Mejor ganador cuartos Oro",
    awaySlot: "Peor ganador cuartos Oro",
    time: "12:00",
    court: 1,
  },
  {
    roundLabel: "Copa de Oro · Semifinal · 2° mejor ganador vs 3° mejor ganador",
    homeSlot: "2° mejor ganador cuartos Oro",
    awaySlot: "3° mejor ganador cuartos Oro",
    time: "12:40",
    court: 2,
  },
  {
    roundLabel: "Copa de Oro · Final",
    homeSlot: "Ganador SF Oro 1",
    awaySlot: "Ganador SF Oro 2",
    time: "17:00",
    court: 1,
  },
];

/** Semis + final de Plata, después de 4 cuartos. */
export const plataAfterCuartos: OfficialBracketMatch[] = [
  {
    roundLabel: "Copa de Plata · Semifinal · Mejor ganador vs Peor ganador",
    homeSlot: "Mejor ganador cuartos Plata",
    awaySlot: "Peor ganador cuartos Plata",
    time: "18:00",
    court: 1,
  },
  {
    roundLabel: "Copa de Plata · Semifinal · 2° mejor ganador vs 3° mejor ganador",
    homeSlot: "2° mejor ganador cuartos Plata",
    awaySlot: "3° mejor ganador cuartos Plata",
    time: "18:40",
    court: 2,
  },
  {
    roundLabel: "Copa de Plata · Final",
    homeSlot: "Ganador SF Plata 1",
    awaySlot: "Ganador SF Plata 2",
    time: "19:20",
    court: 1,
  },
];

/** 2015/2018: la plata ya arranca en semis (4 equipos). Solo falta la final. */
export const plataFinalOnly: OfficialBracketMatch[] = [
  {
    roundLabel: "Copa de Plata · Final",
    homeSlot: "Ganador SF Plata 1",
    awaySlot: "Ganador SF Plata 2",
    time: "19:20",
    court: 1,
  },
];

/** 2019/2020: 9° y 10° entran en semis de Plata. */
export const plata2019AfterCuartos: OfficialBracketMatch[] = [
  {
    roundLabel: "Copa de Plata · Semifinal · Ganador 11° vs 14° vs 9°",
    homeSlot: "Ganador QF Plata 1",
    awaySlot: "9°",
    time: "18:00",
    court: 1,
  },
  {
    roundLabel: "Copa de Plata · Semifinal · Ganador 12° vs 13° vs 10°",
    homeSlot: "Ganador QF Plata 2",
    awaySlot: "10°",
    time: "18:40",
    court: 2,
  },
  {
    roundLabel: "Copa de Plata · Final",
    homeSlot: "Ganador SF Plata 1",
    awaySlot: "Ganador SF Plata 2",
    time: "19:20",
    court: 1,
  },
];
