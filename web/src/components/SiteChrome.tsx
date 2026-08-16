import Link from "next/link";
import { allPillars } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="masthead">
      <div className="masthead-kicker">
        <span>Brasil · cannabis medicinal</span>
        <span className="masthead-kicker-mid">edição contínua</span>
        <span>leitura pública, evidência nomeada</span>
      </div>
      <div className="masthead-title">
        <Link href="/" className="nameplate">
          <span className="seal" aria-hidden="true">
            TSC
          </span>
          <span className="nameplate-text">
            <span className="nameplate-tudo">Tudo Sobre</span>
            <span className="nameplate-cannabis">Cannabis</span>
          </span>
        </Link>
        <p className="dek">O portal de cannabis medicinal do Brasil — para quem precisa entender, não para quem quer vender.</p>
      </div>
      <nav className="nav-pillars" aria-label="Pilares">
        {allPillars().map((pillar) => (
          <Link key={pillar.id} href={pillar.href}>
            {pillar.label}
          </Link>
        ))}
        <Link href="/sobre">Sobre</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        Tudo Sobre Cannabis é um veículo editorial. Os textos não substituem consulta, diagnóstico
        nem prescrição. Cannabis medicinal no Brasil exige prescritor e trilha sanitária vigente.
      </p>
      <p className="footer-meta">
        <Link href="/sobre">Expediente e método</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/acesso/como-comecar-cannabis-medicinal-brasil">Como começar</Link>
      </p>
    </footer>
  );
}
