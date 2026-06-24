import Image from "next/image";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { MobileNav } from "@/components/mobile-nav";
import { navItems, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

function whatsappUrl() {
  const text = encodeURIComponent(siteConfig.whatsapp.message);
  return `https://wa.me/${siteConfig.whatsapp.number}?text=${text}`;
}

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

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={siteConfig.preinscripcionFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-yellow-400/50 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-yellow-400 transition hover:bg-yellow-400/10 lg:inline-flex"
            >
              Preinscripción
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-yellow-400 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-yellow-300 sm:inline-flex"
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
            <MobileNav
              preinscripcionUrl={siteConfig.preinscripcionFormUrl}
              whatsappUrl={whatsappUrl()}
            />
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
        <div className="mx-auto mb-8 max-w-4xl">
          <p className="font-display mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
            Auspiciantes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {siteConfig.sponsors.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.href}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-90 transition hover:opacity-100"
                title={sponsor.name}
              >
                <div className="flex h-24 w-36 items-center justify-center rounded-xl bg-white/95 p-3 sm:h-28 sm:w-44">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <p className="font-display text-lg font-semibold uppercase tracking-wide text-white">
        {siteConfig.name}
      </p>
      <p className="mt-2 font-display text-sm uppercase tracking-wider text-white/70">
        {siteConfig.club} · {siteConfig.city}
      </p>
      <p className="mt-4 text-xs text-white/50">
        Edición {siteConfig.edition} —{" "}
        <Link href="/admin/login" className="text-white/40 hover:text-yellow-400">
          Panel coordinador
        </Link>
      </p>
    </footer>
  );
}
