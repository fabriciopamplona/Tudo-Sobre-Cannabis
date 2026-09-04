import Link from "next/link";
import { allPillars } from "@/lib/site";
import { HeaderControls } from "./HeaderControls";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        T
      </span>
      {compact ? null : (
        <span>
          <span className="brand-name">Tudo Sobre</span>
          <span className="brand-sub">cannabis</span>
        </span>
      )}
    </span>
  );
}

export function SiteHeader() {
  const pillars = allPillars();
  const menuItems = [
    ...pillars,
    { id: "esteira", href: "/esteira", label: "Esteira" },
    { id: "sobre", href: "/sobre", label: "Sobre" },
  ];

  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <Link href="/" aria-label="Tudo Sobre Cannabis">
          <Brand />
        </Link>
        <nav className="nav-main" aria-label="Pilares">
          {pillars.map((pillar) => (
            <Link key={pillar.id} href={pillar.href}>
              {pillar.label}
            </Link>
          ))}
          <Link href="/sobre">Sobre</Link>
          <Link href="/esteira">Esteira</Link>
        </nav>
        <HeaderControls items={menuItems} />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <div>
          <Link href="/" aria-label="Tudo Sobre Cannabis">
            <Brand />
          </Link>
          <p>
            Uma publicação independente para falar de cannabis com a cabeça aberta e os pés
            no chão. Os textos não substituem consulta, diagnóstico nem prescrição.
          </p>
        </div>
        <div className="footer-meta">
          <Link href="/sobre">Expediente e método</Link>
          <Link href="/esteira">Esteira editorial</Link>
          <Link href="/acesso/como-comecar-cannabis-medicinal-brasil">Como começar</Link>
          <span className="legal-line">© 2026 Tudo Sobre Cannabis</span>
        </div>
      </div>
    </footer>
  );
}
