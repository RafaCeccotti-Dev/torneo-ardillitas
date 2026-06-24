import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";

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
        "sticky top-0 z-50 border-b border-yellow-400/20 bg-black/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 lg:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-white">
          <div className="relative h-12 w-12 shrink-0">
            <Image
              src={siteConfig.logos.header}
              alt="Logo Torneo Ardillitas"
              fill
              className="object-contain"
              sizes="48px"
              priority
            />
          </div>
          <div className="min-w-0 leading-none">
            <span className="font-display block whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] text-yellow-400 sm:text-sm lg:text-[15px] lg:tracking-[0.14em]">
              {siteConfig.club}
            </span>
            <span className="font-display mt-1.5 block text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
              {siteConfig.shortName}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-[15px] font-medium tracking-wide text-white/95 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

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
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <details className="relative xl:hidden">
            <summary className="flex cursor-pointer list-none items-center rounded-full border border-white/20 p-2.5 text-white">
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-yellow-400/20 bg-black/95 p-2 shadow-xl">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={siteConfig.preinscripcionFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-400 hover:bg-white/10"
              >
                Preinscripción
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-400 hover:bg-white/10"
              >
                WhatsApp
              </a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-yellow-400/20 bg-black px-4 py-8 text-center text-sm text-white/70">
      <p className="font-display text-lg font-semibold uppercase tracking-wide text-white">
        {siteConfig.name}
      </p>
      <p className="mt-2 font-display text-sm uppercase tracking-wider text-white/70">
        {siteConfig.club} · {siteConfig.city}
      </p>
      <p className="mt-4 text-xs text-white/50">
        Edición {siteConfig.edition} — panel de coordinadores próximamente
      </p>
    </footer>
  );
}
