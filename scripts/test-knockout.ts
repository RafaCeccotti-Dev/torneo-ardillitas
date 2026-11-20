import { pairBestVsWorst, type RankedTeam } from "../src/lib/knockout";
import type { Team } from "../src/lib/types";

function team(id: string, name: string, seed: number): RankedTeam {
  const t: Team = { id, name, slug: id, group: "A" };
  return { team: t, groupPos: seed, generalRank: seed, seed, points: 0, goalDiff: 0, goalsFor: 0 };
}

const first = team("1", "Primero", 1);
const second = team("2", "Segundo", 2);
const third = team("3", "Tercero", 3);
const fourth = team("4", "Cuarto", 4);

const a = pairBestVsWorst([first, fourth]);
const b = pairBestVsWorst([third, fourth]);
const c = pairBestVsWorst([first, third]);
const d = pairBestVsWorst([first, second, third, fourth]);

function names(pairs: ReturnType<typeof pairBestVsWorst>) {
  return pairs.map(([x, y]) => `${x.team.name} vs ${y.team.name}`).join(" | ");
}

const checks = [
  names(a) === "Primero vs Cuarto",
  names(b) === "Tercero vs Cuarto",
  names(c) === "Primero vs Tercero",
  names(d) === "Primero vs Cuarto | Segundo vs Tercero",
];

if (checks.some((ok) => !ok)) {
  console.log({ a: names(a), b: names(b), c: names(c), d: names(d) });
  process.exit(1);
}

console.log("knockout pairing ok");
