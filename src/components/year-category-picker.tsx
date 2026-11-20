import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  yearDisplayName,
  type TournamentCategorySlug,
} from "@/lib/tournament-categories";

type YearCategoryPickerProps = {
  basePath: string;
  years: string[];
  category?: TournamentCategorySlug;
  /** Años que ya tienen contenido cargado */
  yearsWithContent?: string[];
};

export function YearCategoryPicker({
  basePath,
  years,
  category,
  yearsWithContent = years,
}: YearCategoryPickerProps) {
  const contentSet = new Set(yearsWithContent);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {years.map((yearLabel) => {
        const slug = yearLabel.replace(/\//g, "-");
        const hasContent = contentSet.has(yearLabel);
        const title = category ? yearDisplayName(category, yearLabel) : yearLabel;
        return (
          <Link
            key={yearLabel}
            href={`${basePath}/${encodeURIComponent(slug)}`}
            className="group flex items-center justify-between rounded-2xl border border-yellow-400/15 bg-black/50 px-5 py-4 transition hover:border-yellow-400/40 hover:bg-white/5"
          >
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-wide text-white">
                Categoría {title}
              </p>
              <p className="mt-1 text-sm text-white/60">
                {hasContent ? "Ver detalle" : "Próximamente"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-yellow-400 transition group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}
