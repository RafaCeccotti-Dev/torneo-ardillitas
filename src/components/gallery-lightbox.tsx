"use client";

import Image from "next/image";
import { useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { GalleryPhoto } from "@/lib/types";

export function GalleryLightbox({ photos }: { photos: GalleryPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex == null ? null : photos[activeIndex] ?? null;

  const close = useCallback(() => setActiveIndex(null), []);

  const showPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current == null || photos.length === 0) return current;
      return (current - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current == null || photos.length === 0) return current;
      return (current + 1) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex == null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, close, showPrev, showNext]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            className="overflow-hidden rounded-2xl border border-yellow-400/15 bg-black/50"
          >
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative block aspect-[4/3] w-full cursor-zoom-in text-left outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-yellow-400"
              aria-label={
                photo.caption
                  ? `Ver foto: ${photo.caption}`
                  : `Ver foto ${index + 1} en grande`
              }
            >
              <Image
                src={photo.src}
                alt={photo.caption || `Foto del torneo ${index + 1}`}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
            </button>
            {photo.caption ? (
              <figcaption className="p-3 text-sm text-white/80">{photo.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Foto en grande"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 z-[81] rounded-full border border-white/20 bg-black/50 p-2 text-white transition hover:bg-white/10 sm:right-5 sm:top-5"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrev();
                }}
                className="absolute left-2 z-[81] rounded-full border border-white/20 bg-black/50 p-2 text-white transition hover:bg-white/10 sm:left-5"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-2 z-[81] rounded-full border border-white/20 bg-black/50 p-2 text-white transition hover:bg-white/10 sm:right-5"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <div
            className="relative flex max-h-[min(90vh,900px)] w-full max-w-5xl flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[min(78vh,820px)] w-full overflow-hidden rounded-2xl outline outline-1 outline-white/10">
              <Image
                src={active.src}
                alt={active.caption || "Foto del torneo"}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            <div className="mt-3 flex w-full items-center justify-between gap-3 px-1 text-sm text-white/75">
              <p className="min-w-0 truncate">{active.caption || "Sin descripción"}</p>
              <p className="shrink-0 tabular-nums text-white/55">
                {(activeIndex ?? 0) + 1} / {photos.length}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
