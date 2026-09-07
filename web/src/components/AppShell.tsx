"use client";

import { usePathname } from "next/navigation";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { allPillars } from "@/lib/site";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const pillarIds = allPillars().map((pillar) => pillar.id);
  const isArticle = parts.length === 2 && pillarIds.includes(parts[0]);
  const isReview = parts[0] === "esteira" && parts.length === 2 && /^\d+$/.test(parts[1] || "");

  if (isArticle || isReview) {
    return children;
  }

  return (
    <>
      <div className="edition-bar">
        Edição contínua · 2026 — informação para quebrar tabus e cultivar mentes abertas
      </div>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
