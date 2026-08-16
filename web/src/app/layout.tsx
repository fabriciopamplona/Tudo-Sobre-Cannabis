import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
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
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full">
        <div className="page-shell">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
