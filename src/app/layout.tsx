import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/config/site";
import { barlowCondensed, inter } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
