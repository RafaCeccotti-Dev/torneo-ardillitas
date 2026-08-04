"use client";

import Image from "next/image";
import { useState } from "react";

import { backgroundImages, type BackgroundKey } from "@/config/site";
import { cn } from "@/lib/utils";

type PageBackgroundProps = {
  imageKey?: BackgroundKey;
  imageSrc?: string;
  className?: string;
  children: React.ReactNode;
  overlay?: "light" | "dark" | "strong";
};

const overlayClass = {
  light: "bg-black/35",
  dark: "bg-black/55",
  strong: "bg-gradient-to-b from-black/75 via-black/60 to-black/80",
};

export function PageBackground({
  imageKey = "hero",
  imageSrc,
  className,
  children,
  overlay = "strong",
}: PageBackgroundProps) {
  const src = imageSrc ?? backgroundImages[imageKey];
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative min-h-[70vh] overflow-hidden", className)}>
      {!failed ? (
        <Image
          src={src}
          alt=""
          fill
          priority={imageKey === "hero"}
          className="object-cover"
          sizes="100vw"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-yellow-600/40" />
      )}
      <div className={cn("absolute inset-0", overlayClass[overlay])} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
