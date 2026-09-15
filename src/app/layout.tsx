import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "MaPlaquePro — Plaques personnalisées, gravées et imprimées sur mesure", template: "%s — MaPlaquePro" },
  description:
    "Composez votre plaque personnalisée, visualisez-la à l'échelle et validez le BAT avant fabrication. Gravure laser et impression UV, dans notre atelier.",
  icons: { icon: "/brand/maplaquepro.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f2f1ec",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        <SiteHeader />
        <div id="contenu">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
