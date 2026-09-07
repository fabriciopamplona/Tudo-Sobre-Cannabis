import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const sans = localFont({
  src: "./fonts/Manrope.ttf",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Tudo Sobre Cannabis — conteúdo ponta firme",
    template: "%s · Tudo Sobre Cannabis",
  },
  description:
    "Publicação independente sobre cannabis: ciência, saúde, regulação, mercado e cultura. Sem hype, sem tabu — nem precisa perguntar, a gente explica.",
  openGraph: {
    locale: "pt_BR",
    type: "website",
    siteName: "Tudo Sobre Cannabis",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${sans.variable} h-full`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
