import Image from "next/image";
import Link from "next/link";

import { InstagramIcon } from "@/components/icons/instagram-icon";
import { MobileNav } from "@/components/mobile-nav";
import { SponsorsMarquee } from "@/components/sponsors-marquee";
import { navItems, siteConfig } from "@/config/site";
import { formatEdition } from "@/lib/edition";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-yellow-400/20 bg-black/90 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-white">
            <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
              <Image
                src={siteConfig.logos.header}
                alt="Logo Torneo Ardillitas"
                fill
                className="object-contain"
                sizes="56px"
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="font-display block whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] text-yellow-400 sm:text-sm lg:text-[15px] lg:tracking-[0.14em]">
                {siteConfig.club}
              </span>
              <span className="font-display mt-2 block text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
                {siteConfig.shortName}
              </span>
            </div>
          </Link>

          {siteConfig.sponsors.length > 0 ? (
            <SponsorsMarquee
              variant="header"
              className="hidden min-w-0 max-w-xl flex-1 md:block"
            />
          ) : null}

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={siteConfig.preinscripcionFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-yellow-400/50 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-yellow-400 transition hover:bg-yellow-400/10 lg:inline-flex"
            >
              Preinscripción
            </a>
            <MobileNav preinscripcionUrl={siteConfig.preinscripcionFormUrl} />
          </div>
        </div>

        <nav className="hidden border-t border-yellow-400/15 pb-4 pt-4 xl:block">
          <div className="flex flex-wrap items-center justify-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2.5 text-[15px] font-medium tracking-wide text-white/95 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-yellow-400/20 bg-black px-4 py-10 text-center text-sm text-white/70">
      {siteConfig.sponsors.length > 0 ? (
        <div className="mx-auto mb-8 w-full max-w-6xl">
          <p className="font-display mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Auspiciantes
          </p>
          <SponsorsMarquee variant="footer" className="pb-2" />
        </div>
      ) : null}

      <p className="font-display text-lg font-semibold uppercase tracking-wide text-white">
        {siteConfig.name}{" "}
        <span className="text-yellow-400">· Edición {formatEdition()}</span>
      </p>
      <p className="mt-2 font-display text-sm uppercase tracking-wider text-white/70">
        {siteConfig.club} · {siteConfig.city}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 text-sm text-white/80">
        <a
          href={siteConfig.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-yellow-400 transition hover:text-yellow-300"
        >
          <InstagramIcon className="h-[18px] w-[18px]" />
          @{siteConfig.instagram.handle}
        </a>
        <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>Desarrollo:</span>
          <span className="font-medium text-white">{siteConfig.developer.name}</span>
          <a
            href={siteConfig.developer.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-yellow-400 transition hover:text-yellow-300"
          >
            <InstagramIcon className="h-4 w-4" />
            @{siteConfig.developer.instagramHandle}
          </a>
        </p>
      </div>
    </footer>
  );
}
