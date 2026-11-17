import Link from "next/link";

import {
  tournamentCategories,
  type TournamentCategorySlug,
  yearToSlug,
} from "@/lib/tournament-categories";
import { cn } from "@/lib/utils";

function pillClass(active: boolean) {
  return cn(
    "font-display rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide transition",
    active
      ? "bg-yellow-400 text-black"
      : "border border-yellow-400/35 bg-black/40 text-white hover:border-yellow-400 hover:bg-white/10",
  );
}

export function TournamentFilters({
  basePath,
  categoria,
  yearLabel,
  years,
}: {
  basePath: "/partidos" | "/tabla";
  categoria?: TournamentCategorySlug;
  yearLabel?: string;
  years?: string[];
}) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-wrap gap-2">
        {tournamentCategories.map((category) => (
          <Link
            key={category.slug}
            href={`${basePath}/${category.slug}`}
            className={pillClass(category.slug === categoria)}
          >
            {category.title.replace("Fútbol ", "")}
          </Link>
        ))}
      </div>
      {categoria && years && years.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {years.map((year) => (
            <Link
              key={year}
              href={`${basePath}/${categoria}/${yearToSlug(year)}`}
              className={pillClass(year === yearLabel)}
            >
              {year}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
