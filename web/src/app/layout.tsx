import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Fraunces } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
});

const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const mono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Tudo Sobre Cannabis — portal de cannabis medicinal",
    template: "%s · Tudo Sobre Cannabis",
  },
  description:
    "Portal editorial de cannabis medicinal no Brasil: acesso legal, evidência por condição, canabinoides e jornada do paciente e da família.",
  openGraph: {
    locale: "pt_BR",
    type: "website",
    siteName: "Tudo Sobre Cannabis",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}
    >
      <body className="editorial-noise min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
