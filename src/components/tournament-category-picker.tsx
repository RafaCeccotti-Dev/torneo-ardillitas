import Link from "next/link";
import { Users } from "lucide-react";

import { tournamentCategories } from "@/lib/tournament-categories";

type TournamentCategoryPickerProps = {
  /** Ruta base: /tabla o /partidos */
  basePath?: "/tabla" | "/partidos";
  /** Texto del CTA en cada tarjeta */
  ctaLabel?: string;
};

export function TournamentCategoryPicker({
  basePath = "/tabla",
  ctaLabel = "Ver categorías →",
}: TournamentCategoryPickerProps) {
  const descriptions: Record<string, string> =
    basePath === "/partidos"
      ? {
          masculino: "Fixture por categoría de nacimiento: grupos y cruces.",
          femenino: "Fixture por categoría de nacimiento: grupos y cruces.",
        }
      : {
          masculino: "Tablas por categoría de nacimiento y grupos del torneo.",
          femenino: "Tablas por categoría de nacimiento y grupos del torneo.",
        };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tournamentCategories.map((category) => (
        <Link
          key={category.slug}
          href={`${basePath}/${category.slug}`}
          className="group rounded-2xl border border-yellow-400/15 bg-black/50 p-6 transition hover:border-yellow-400/40 hover:bg-white/5"
        >
          <Users className="mb-4 h-10 w-10 text-yellow-400 transition group-hover:scale-105" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
            {category.title}
          </h2>
          <p className="mt-2 text-sm text-white/70">
            {descriptions[category.slug] ?? category.description}
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-yellow-400 group-hover:text-yellow-300">
            {ctaLabel}
          </span>
        </Link>
      ))}
    </div>
  );
}
