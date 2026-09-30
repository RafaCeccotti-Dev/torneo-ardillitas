"use client";

import { usePathname } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.startsWith("/acreditar");

  if (bare) {
    return <main className="min-h-screen bg-black">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      {pathname.startsWith("/admin") ? null : <WhatsAppFloat />}
    </>
  );
}
