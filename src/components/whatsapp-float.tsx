import Image from "next/image";

import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsAppFloat() {
  const url = whatsappUrl(siteConfig.whatsapp.number, siteConfig.whatsapp.message);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escribir por WhatsApp al ${siteConfig.whatsapp.label.toLowerCase()}`}
      title="Escribinos por WhatsApp"
      className="group fixed bottom-4 right-3 z-40 flex items-end gap-2 sm:bottom-6 sm:right-5"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="font-display mb-4 hidden rounded-full border-2 border-black bg-yellow-400 px-4 py-2 text-sm font-bold uppercase tracking-wide text-black shadow-lg transition group-hover:bg-yellow-300 sm:inline-block">
        ¿Consultas?
      </span>
      <span className="relative block h-20 w-20 transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-105 sm:h-24 sm:w-24">
        <Image
          src={siteConfig.logos.whatsapp}
          alt=""
          fill
          sizes="96px"
          className="object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]"
        />
      </span>
    </a>
  );
}
