import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import localFont from "next/font/local";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const sans = localFont({
  src: "./fonts/Manrope.ttf",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Tudo Sobre Cannabis, conteúdo ponta firme para Canabistas e Entusiastas",
    template: "%s · Tudo Sobre Cannabis",
  },
  description:
    "Publicação independente sobre cannabis envolvendo ciência, saúde, regulação, mercado e cultura. Comunicação direta, sem hype ou tabu. Nem precisa perguntar, a gente explica.",
  openGraph: {
    locale: "pt_BR",
    type: "website",
    siteName: "Tudo Sobre Cannabis",
    title: "Tudo Sobre Cannabis, conteúdo ponta firme para Canabistas e Entusiastas",
    description:
      "Publicação independente sobre cannabis envolvendo ciência, saúde, regulação, mercado e cultura. Comunicação direta, sem hype ou tabu. Nem precisa perguntar, a gente explica.",
    images: [
      {
        url: "/brand/og-default.png",
        width: 1200,
        height: 630,
        alt: "Tudo Sobre Cannabis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tudo Sobre Cannabis, conteúdo ponta firme para Canabistas e Entusiastas",
    description:
      "Publicação independente sobre cannabis envolvendo ciência, saúde, regulação, mercado e cultura. Comunicação direta, sem hype ou tabu. Nem precisa perguntar, a gente explica.",
    images: ["/brand/og-default.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${sans.variable} h-full`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
