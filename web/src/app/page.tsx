import Link from "next/link";
import { HomeArchive } from "@/components/HomeArchive";
import { EditorialArt } from "@/components/EditorialArt";
import { ArrowUpRightIcon, ChevronRightIcon, MailIcon } from "@/components/Icons";
import { allPillars, getArticles } from "@/lib/content";

export default function HomePage() {
  const articles = getArticles();
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
              <span /> Um portal para entender melhor
            </p>
            <h1 className="hero-title reveal reveal-delay-1">
              Nem precisa
              <br />
              <em>perguntar.</em>
            </h1>
            <p className="hero-dek reveal reveal-delay-2">
              A gente explica cannabis com ciência, contexto e uma dose saudável de
              curiosidade.
            </p>
            <div className="hero-actions reveal reveal-delay-3">
              {lead ? (
                <Link href={`/${lead.pillar}/${lead.slug}`} className="btn-lime">
                  Comece por aqui <ArrowUpRightIcon />
                </Link>
              ) : null}
              <a href="#arquivo" className="btn-ghost">
                Explorar leituras <ChevronRightIcon />
              </a>
            </div>
          </div>
          {lead ? (
            <div>
              <div className="hero-card-meta">
                <span>Na mesa da redação</span>
                <span>
                  01 — {String(articles.length).padStart(2, "0")}
                </span>
              </div>
              <Link href={`/${lead.pillar}/${lead.slug}`} className="hero-card">
                <div className="hero-card-grid">
                  <EditorialArt seed={lead.slug} label={lead.keyword || lead.pillar} />
                  <div>
                    <p className="font-mono-editorial" style={{ fontSize: 10, color: "var(--tsc-lime)" }}>
                      {lead.pillar} / em destaque
                    </p>
                    <h2>{lead.title}</h2>
                    <p>{lead.description}</p>
                    <div className="hero-card-cta">Ler análise →</div>
                  </div>
                </div>
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <HomeArchive articles={articles} filters={filters} />

      <section className="about-band">
        <div className="wrap section about-grid">
          <div className="about-art" aria-hidden="true">
            <span className="art-ring" style={{ right: "-3rem", top: "-2.5rem", width: "15rem", height: "15rem", borderColor: "rgba(241,237,226,.35)" }} />
            <span className="art-ring" style={{ bottom: "-4rem", left: "-2rem", width: "11rem", height: "11rem", borderColor: "rgba(23,53,47,.3)" }} />
            <div className="about-art-copy">
              <span className="font-mono-editorial" style={{ fontSize: 10 }}>
                Carta da redação
              </span>
              <strong>
                02
                <br />
                <em>coisas</em>
                <br />
                podem ser verdade.
              </strong>
            </div>
          </div>
          <div className="about-copy">
            <p className="section-kicker">Por que existimos</p>
            <h2 className="section-title">
              Curiosidade sem
              <br />
              <span style={{ color: "var(--tsc-kicker)" }}>pânico moral.</span>
            </h2>
            <p>
              Tudo Sobre Cannabis nasceu de uma vontade simples: trocar a pressa da
              manchete por uma conversa bem feita. Somos uma publicação independente
              sobre a planta, as pessoas e as perguntas que ela coloca no mundo.
            </p>
            <div className="about-points">
              <div>
                <h3>Contexto</h3>
                <p>A notícia é o ponto de partida, não o ponto final.</p>
              </div>
              <div>
                <h3>Cuidado</h3>
                <p>Informação responsável também sabe dizer “ainda não sabemos”.</p>
              </div>
            </div>
            <p>
              <Link href="/sobre" className="btn-ghost" style={{ color: "var(--tsc-ink)", paddingLeft: 0 }}>
                Expediente e método <ChevronRightIcon />
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="newsletter">
        <div className="wrap section newsletter-grid">
          <div>
            <p className="section-kicker">Uma carta por semana</p>
            <h2 className="section-title">
              Menos ruído.
              <br />
              <em>Mais contexto.</em>
            </h2>
            <p>
              Os melhores textos da semana, uma pergunta boa e nenhum spam. Direto na
              sua caixa de entrada.
            </p>
          </div>
          <div>
            <form
              className="newsletter-form"
              action="https://tudosobrecannabis.substack.com/"
              method="get"
              target="_blank"
              rel="noreferrer"
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Seu melhor e-mail
              </label>
              <div className="newsletter-field">
                <MailIcon />
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu melhor e-mail"
                  autoComplete="email"
                />
              </div>
              <button type="submit" className="btn-lime">
                Assinar a carta
              </button>
            </form>
            <p className="newsletter-note">Leitura livre · sair quando quiser · feito no Brasil</p>
          </div>
        </div>
      </section>
    </>
  );
}
