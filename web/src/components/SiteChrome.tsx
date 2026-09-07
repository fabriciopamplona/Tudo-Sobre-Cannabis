import Link from "next/link";

type BrandProps = {
  compact?: boolean;
  /** Verde sobre papel; marfim sobre fundo escuro (ink). */
  tone?: "verde" | "marfim";
  /** Quando o link pai já nomeia a marca, deixe alt vazio. */
  decorative?: boolean;
};

export function Brand({ compact = false, tone = "verde", decorative = true }: BrandProps) {
  // PNG leve no header (~10 KB); símbolo SVG só no compacto.
  const src = compact
    ? "/brand/simbolo.svg"
    : tone === "marfim"
      ? "/brand/logo-marfim-header.png"
      : "/brand/logo-verde-header.png";

  return (
    <span className="brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={`brand-logo${compact ? " brand-logo-compact" : ""}`}
        src={src}
        width={compact ? 56 : 200}
        height={compact ? 56 : 70}
        alt={decorative ? "" : "Tudo Sobre Cannabis"}
        decoding="async"
      />
    </span>
  );
}

const NAV = [
  { href: "/posts", label: "Posts" },
  { href: "/sobre", label: "Sobre nós" },
  {
    href: "https://tudosobrecannabis.substack.com/",
    label: "Newsletter",
    external: true,
  },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header-inner">
        <Link href="/" aria-label="Tudo Sobre Cannabis">
          <Brand />
        </Link>
        <nav className="nav-main" aria-label="Principal">
          {NAV.map((item) =>
            "external" in item && item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
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
            <Brand tone="marfim" />
          </Link>
          <p>
            Uma publicação independente para falar de cannabis com a cabeça aberta e os pés
            no chão. Os textos não substituem consulta, diagnóstico nem prescrição.
          </p>
        </div>
        <div className="footer-meta">
          <Link href="/posts">Posts</Link>
          <Link href="/sobre">Sobre nós</Link>
          <a
            className="btn-lime footer-cta"
            href="https://tudosobrecannabis.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Assine a newsletter
          </a>
          <span className="legal-line">© 2026 Tudo Sobre Cannabis</span>
        </div>
      </div>
    </footer>
  );
}
