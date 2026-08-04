"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { navItems } from "@/config/site";

type MobileNavProps = {
  preinscripcionUrl: string;
  whatsappUrl: string;
};

export function MobileNav({ preinscripcionUrl, whatsappUrl }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="flex items-center rounded-full border border-white/20 p-2.5 text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-yellow-400/20 bg-black/95 p-2 shadow-xl">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={preinscripcionUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-400 hover:bg-white/10"
            >
              Preinscripción
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-400 hover:bg-white/10"
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
          </div>
        </>
      ) : null}
    </div>
  );
}
