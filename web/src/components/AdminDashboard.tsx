"use client";

import { useMemo, useState } from "react";
import type { AdminDashboardData } from "@/lib/admin-data";

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}

function fmtSec(n: number) {
  if (n < 60) return `${Math.round(n)}s`;
  return `${Math.floor(n / 60)}m ${Math.round(n % 60)}s`;
}

export function AdminLoginForm({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Falha no login.");
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Erro de rede.");
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <p className="admin-kicker">Tudo Sobre Cannabis</p>
      <h1>Admin</h1>
      <p className="admin-lead">
        Métricas de audiência, Search Console e oportunidades de keyword. Área interna —
        não indexada.
      </p>
      {!configured ? (
        <p className="admin-warn">
          Defina <code>ADMIN_PASSWORD</code> no <code>.env.local</code> se quiser senha
          extra no localhost (opcional).
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="admin-login-form">
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading || !configured}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
        {error ? <p className="admin-err">{error}</p> : null}
      </form>
    </div>
  );
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const [tab, setTab] = useState<"overview" | "search" | "content" | "competitors">(
    "overview",
  );
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const seedNote = useMemo(() => {
    if (data.dataNotes.live) return null;
    return "Números ainda em seed — configure a service account Google no .env.local e clique em Atualizar GA+GSC.";
  }, [data.dataNotes.live]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function syncNow() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const json = await res.json();
      if (!res.ok || (!json.ok && !json.skipped)) {
        setSyncMsg(json.error || json.errors?.join(" · ") || json.reason || "Falha no sync.");
        setSyncing(false);
        return;
      }
      setSyncMsg(json.skipped ? json.reason || "Cache ok" : "Sync ok — recarregando…");
      window.location.reload();
    } catch {
      setSyncMsg("Erro de rede no sync.");
      setSyncing(false);
    }
  }

  return (
    <div className="admin-app">
      <header className="admin-top">
        <div>
          <p className="admin-kicker">Painel interno</p>
          <h1>Audiência & Search</h1>
          <p className="admin-lead">
            {data.liveSite} · gerado {new Date(data.generatedAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="admin-top-actions">
          <button
            type="button"
            className="admin-btn"
            onClick={syncNow}
            disabled={syncing || !data.sync.canSync}
            title={
              data.sync.canSync
                ? "Buscar GA4 + GSC agora"
                : "Faltam envs Google no .env.local"
            }
          >
            {syncing ? "Sincronizando…" : "Atualizar GA+GSC"}
          </button>
          {data.lookerUrl ? (
            <a className="admin-btn is-ghost" href={data.lookerUrl} target="_blank" rel="noreferrer">
              Looker Studio
            </a>
          ) : null}
          <button type="button" className="admin-btn is-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <p className="admin-banner">{data.esteiraNote}</p>
      {seedNote ? <p className="admin-banner is-seed">{seedNote}</p> : null}
      {!data.sync.canSync ? (
        <p className="admin-banner is-seed">
          Sync automático desligado: falta service account + GA4_PROPERTY_ID + GSC_SITE_URL.
          Ver docs/ADMIN.md (prompt Cowork).
        </p>
      ) : null}
      {data.sync.errors?.length ? (
        <p className="admin-banner is-seed">Último sync: {data.sync.errors.join(" · ")}</p>
      ) : null}
      {syncMsg ? <p className="admin-banner">{syncMsg}</p> : null}

      <nav className="admin-tabs" aria-label="Seções">
        {(
          [
            ["overview", "Visão geral"],
            ["search", "Search / GSC"],
            ["content", "Conteúdo"],
            ["competitors", "Concorrentes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "is-active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <section className="admin-section">
          <div className="admin-kpi-grid">
            <article>
              <span>Sessões ({data.ga.periodDays}d)</span>
              <strong>{fmt(data.ga.kpis.sessions)}</strong>
            </article>
            <article>
              <span>Usuários</span>
              <strong>{fmt(data.ga.kpis.users)}</strong>
            </article>
            <article>
              <span>Pageviews</span>
              <strong>{fmt(data.ga.kpis.pageviews)}</strong>
            </article>
            <article>
              <span>Engajadas</span>
              <strong>{fmt(data.ga.kpis.engagedSessions)}</strong>
            </article>
            <article>
              <span>Tempo médio</span>
              <strong>{fmtSec(data.ga.kpis.avgEngagementSec)}</strong>
            </article>
            <article>
              <span>Bounce</span>
              <strong>{pct(data.ga.kpis.bounceRate)}</strong>
            </article>
          </div>

          <div className="admin-split">
            <div>
              <h2>Canais</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th>Sessões</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ga.channels.map((c) => (
                    <tr key={c.channel}>
                      <td>{c.channel}</td>
                      <td>{fmt(c.sessions)}</td>
                      <td>{pct(c.share)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h2>Top páginas (GA)</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>PV</th>
                    <th>Eng.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ga.topPages.map((p) => (
                    <tr key={p.path}>
                      <td>
                        <code>{p.path}</code>
                      </td>
                      <td>{fmt(p.pageviews)}</td>
                      <td>{fmtSec(p.avgEngagementSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <h2>Inventário no ar</h2>
          <p className="admin-muted">
            {data.inventory.published} posts publicados · {data.inventory.withKeyword} com
            keyword
          </p>
          <ul className="admin-pillars">
            {Object.entries(data.inventory.pillars).map(([pillar, n]) => (
              <li key={pillar}>
                <strong>{n}</strong> {pillar}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "search" ? (
        <section className="admin-section">
          <h2>Queries (GSC · {data.gsc.periodDays}d)</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Impr.</th>
                <th>Cliques</th>
                <th>CTR</th>
                <th>Pos.</th>
                <th>Página</th>
              </tr>
            </thead>
            <tbody>
              {data.gsc.queries.map((q) => (
                <tr key={q.query}>
                  <td>{q.query}</td>
                  <td>{fmt(q.impressions)}</td>
                  <td>{fmt(q.clicks)}</td>
                  <td>{pct(q.ctr)}</td>
                  <td>{q.position.toFixed(1)}</td>
                  <td>
                    <code>{q.page || "—"}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>CTR baixo com impressão (oportunidade de title/meta)</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Impr.</th>
                <th>CTR</th>
                <th>Pos.</th>
              </tr>
            </thead>
            <tbody>
              {data.gsc.lowCtr.map((q) => (
                <tr key={q.query}>
                  <td>{q.query}</td>
                  <td>{fmt(q.impressions)}</td>
                  <td>{pct(q.ctr)}</td>
                  <td>{q.position.toFixed(1)}</td>
                </tr>
              ))}
              {!data.gsc.lowCtr.length ? (
                <tr>
                  <td colSpan={4}>Nenhum alerta no snapshot atual.</td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <h2>Páginas no Search</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Impr.</th>
                <th>Cliques</th>
                <th>CTR</th>
                <th>Pos.</th>
              </tr>
            </thead>
            <tbody>
              {data.gsc.pages.map((p) => (
                <tr key={p.page}>
                  <td>
                    <code>{p.page}</code>
                  </td>
                  <td>{fmt(p.impressions)}</td>
                  <td>{fmt(p.clicks)}</td>
                  <td>{pct(p.ctr)}</td>
                  <td>{p.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "content" ? (
        <section className="admin-section">
          <h2>Mais acessados (pageviews locais)</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Keyword</th>
                <th>Views</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.topContent.map((a) => (
                <tr key={a.slug}>
                  <td>{a.title}</td>
                  <td>{a.keyword || "—"}</td>
                  <td>{fmt(a.views)}</td>
                  <td>
                    <a href={a.href} target="_blank" rel="noreferrer">
                      ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Gaps de keyword (biblioteca KB × publicados)</h2>
          <p className="admin-muted">
            Hubs de alto impact_score ainda sem URL no ar — candidatos naturais da fila.
          </p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Tópico</th>
                <th>Pilar</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {data.keywordGaps.map((g) => (
                <tr key={g.keyword}>
                  <td>{g.keyword}</td>
                  <td>{g.topic}</td>
                  <td>{g.pillar}</td>
                  <td>{fmt(g.impact)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "competitors" ? (
        <section className="admin-section">
          <h2>Monitorados</h2>
          <ul className="admin-comp-list">
            {data.competitors.map((c) => (
              <li key={c.id}>
                <a href={c.url} target="_blank" rel="noreferrer">
                  {c.name}
                </a>
                <span>{c.role}</span>
                <em>{(c.watch || []).join(" · ")}</em>
              </li>
            ))}
          </ul>

          <h2>Sugestões a partir da vigília</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Quem vigia</th>
                <th>Status TSC</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {data.competitorIdeas.map((row) => (
                <tr key={`${row.competitor}-${row.keyword}`}>
                  <td>{row.keyword}</td>
                  <td>{row.competitor}</td>
                  <td>{row.covered ? "coberto" : "gap"}</td>
                  <td>{row.suggestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <footer className="admin-foot">
        Fontes: {data.dataNotes.ga} · {data.dataNotes.gsc} · {data.dataNotes.pageviews}
        {data.ga.propertyLabel ? ` · ${data.ga.propertyLabel}` : ""}
      </footer>
    </div>
  );
}
