"use client";

import { useState } from "react";

import { isPlaceholderTeamName, placeholderBadge } from "@/lib/knockout";
import { cn } from "@/lib/utils";

const sizes = {
  table: "h-10 w-10 sm:h-11 sm:w-11",
  match: "h-12 w-12 sm:h-14 sm:w-14",
  club: "h-16 w-16",
  admin: "h-10 w-10",
} as const;

function initialsFrom(name: string) {
  const letters = name.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  return (letters.slice(0, 2) || name.slice(0, 2)).toUpperCase();
}

function crestSrc(src: string) {
  if (!src.includes("supabase.co/storage/v1/object/public/escudos/")) return src;
  return `/api/crest?u=${encodeURIComponent(src)}`;
}

export function TeamCrest({
  src,
  name,
  size = "table",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const pending = isPlaceholderTeamName(name);
  const showImage = Boolean(src) && !failed && !pending;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-yellow-400/40",
        pending ? "bg-zinc-800" : "bg-white",
        sizes[size],
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={crestSrc(src!)}
          alt=""
          className="h-full w-full object-contain p-[3px]"
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden={pending || undefined}
          className={cn(
            "flex h-full w-full items-center justify-center font-bold",
            pending ? "text-[11px] tracking-tight text-yellow-400" : "text-[10px] text-zinc-800",
          )}
        >
          {pending ? placeholderBadge(name) : initialsFrom(name)}
        </span>
      )}
    </div>
  );
}
