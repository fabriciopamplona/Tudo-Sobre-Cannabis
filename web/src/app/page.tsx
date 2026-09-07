import Link from "next/link";
import Image from "next/image";
import { HomeArchive } from "@/components/HomeArchive";
import { EditorialArt } from "@/components/EditorialArt";
import { ArrowUpRightIcon, ChevronRightIcon } from "@/components/Icons";
import { allPillars, getArticles, getFaqHighlights } from "@/lib/content";

export default function HomePage() {
  const articles = getArticles();
  const faqHighlights = getFaqHighlights();
  const lead = articles[0];
  const filters = [
    { id: "todos", label: "Todos" },
    ...allPillars().map((pillar) => ({ id: pillar.id, label: pillar.label })),
  ];

  return (
    <>
      <section className="hero">
        <span className="hero-orb hero-orb-a" aria-hidden="true" />
        <span className="hero-orb hero-orb-b" aria-hidden="true" />
        <div className="wrap hero-inner">
          <div>
            <p className="hero-kicker reveal">
              <span /> Conteúdo ponta firme para canabistas e entusiastas
            </p>
            <h1 className="hero-title reveal reveal-delay-1">
              Tudo sobre
              <br />
              <em>Cannabis</em>
            </h1>
            <p className="hero-dek reveal reveal-delay-2">
              Nem precisa perguntar, a gente explica tudo sobre Cannabis, com uma
              dose saudável de curiosidade científica e análise crítica de maneira
              sempre embasada e construtiva.
            </p>
            <div className="hero-actions reveal reveal-delay-3">
              {lead ? (
                <Link href={`/${lead.pillar}/${lead.slug}`} className="btn-lime">
                  Comece por aqui <ArrowUpRightIcon />
                </Link>
              ) : null}
              <Link href="/mais-acessados" className="btn-ghost">
                Mais acessados <ChevronRightIcon />
              </Link>
            </div>
          </div>
          {lead ? (
            <div>
              <div className="hero-card-meta">
                <span>Na mesa da redação</span>
                <span className="hero-posts-count">
                  <span className="hero-posts-count-num">
                    {String(articles.length).padStart(2, "0")}
                  </span>
                  <span className="hero-posts-count-label">posts no ar</span>
                </span>
              </div>
              <Link href={`/${lead.pillar}/${lead.slug}`} className="hero-card">
                <div className="hero-card-grid">
                  <EditorialArt
                    seed={lead.slug}
                    label={lead.keyword || lead.pillar}
                    image={lead.image}
                    priority
                  />
                  <div>
                    <p className="font-mono-editorial" style={{ fontSize: 10, color: "var(--tsc-lime)" }}>
                      {lead.pillar} / em destaque
                    </p>
                    <h2>{lead.title}</h2>
                    <p>{lead.description}</p>
                    <div className="hero-card-cta">Ler o texto →</div>
                  </div>
                </div>
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <HomeArchive articles={articles} filters={filters} faqs={faqHighlights} />

      <section className="about-band">
        <div className="wrap section about-grid">
          <div className="about-art">
            <Image
              className="about-art-image"
              src="/brand/ilustracao-existimos-flores.webp"
              alt="Ilustração botânica de flores de cannabis em nanquim e aquarela"
              fill
              sizes="(max-width: 959px) 100vw, 40vw"
              priority={false}
            />
          </div>
          <div className="about-copy">
            <p className="section-kicker">Por que existimos</p>
            <h2 className="section-title">
              <span className="about-title-line1">Cannabis Sem Hype,</span>
              <br />
              <span className="about-title-line2">nem Preconceito</span>
            </h2>
            <p>
              Tudo Sobre Cannabis nasceu de uma vontade simples: informar e inspirar,
              trocando a pressa da manchete “clickbait” por um tom de conversa
              inteligente. Nosso propósito é informar sobre a planta e a mudança de
              perspectiva que ela provoca no mundo através de um olhar científico e
              independente.
            </p>
            <p>
              <a
                href="https://fabriciopamplona.com.br"
                className="btn-ghost"
                style={{ color: "var(--tsc-ink)", paddingLeft: 0 }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Conheça o Editor <ChevronRightIcon />
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
