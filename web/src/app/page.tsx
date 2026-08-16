import Link from "next/link";
import { formatDate, getArticles, pillarMeta } from "@/lib/content";

export default function HomePage() {
  const articles = getArticles();
  const [lead, ...rest] = articles;
  const sides = rest.slice(0, 2);

  return (
    <>
      {lead ? (
        <section className="hero-grid">
          <article>
            <p className="kicker">{pillarMeta(lead.pillar).label}</p>
            <h1 className="hero-title">
              <Link href={`/${lead.pillar}/${lead.slug}`}>{lead.title}</Link>
            </h1>
            <p className="lede">{lead.description}</p>
            <p className="meta-line">
              {formatDate(lead.datePublished)} · {lead.reviewedBy}
            </p>
          </article>
          <aside className="side-stack" aria-label="Também nesta edição">
            {sides.map((article) => (
              <Link
                key={article.slug}
                href={`/${article.pillar}/${article.slug}`}
                className="side-item"
              >
                <p className="kicker">{pillarMeta(article.pillar).label}</p>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
              </Link>
            ))}
          </aside>
        </section>
      ) : null}

      <p className="section-label">Cinco entradas para o portal</p>
      <div className="pillar-grid">
        <Link className="pillar-card" href="/acesso">
          <p className="kicker">01</p>
          <h3>Acesso</h3>
          <p>Receita, ANVISA, farmácia, associação — a ordem que evita golpe.</p>
        </Link>
        <Link className="pillar-card" href="/condicoes">
          <p className="kicker">02</p>
          <h3>Condições</h3>
          <p>Evidência por doença. Epilepsia não é o mesmo texto que ansiedade.</p>
        </Link>
        <Link className="pillar-card" href="/canabinoides">
          <p className="kicker">03</p>
          <h3>Moléculas</h3>
          <p>CBD, THC, espectro, via. Educação, não vitrine.</p>
        </Link>
        <Link className="pillar-card" href="/familia">
          <p className="kicker">04</p>
          <h3>Família</h3>
          <p>A pessoa que pesquisa às 2h da manhã depois da crise.</p>
        </Link>
        <Link className="pillar-card" href="/regulacao">
          <p className="kicker">05</p>
          <h3>Regra</h3>
          <p>RDC, CFM, STJ. O que vale hoje, com data colada.</p>
        </Link>
        <Link className="pillar-card" href="/sobre">
          <p className="kicker">Método</p>
          <h3>Como escrevemos</h3>
          <p>Fontes pré-determinadas, voz humana, gate clínico. Sem milagre.</p>
        </Link>
      </div>
    </>
  );
}
