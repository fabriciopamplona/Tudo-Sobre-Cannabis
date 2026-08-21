// Reference-only source exported from the Replit layout.
// Use it with DESIGN_SYSTEM.md; preserve the existing Next.js data and routes.

import { useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronRight,
  Clock3,
  FlaskConical,
  HeartPulse,
  History,
  Landmark,
  Leaf,
  Mail,
  Menu,
  Search,
  Send,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Category = 'Todos' | 'Ciência' | 'Saúde' | 'Política' | 'História' | 'Cultura';
type Article = {
  id: number;
  category: Exclude<Category, 'Todos'>;
  eyebrow: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  accent: string;
  icon: 'science' | 'health' | 'policy' | 'history' | 'culture';
  featured?: boolean;
};

const articles: Article[] = [
  {
    id: 1,
    category: 'Política',
    eyebrow: 'O que muda na prática',
    title: 'A nova regra da Anvisa para cannabis medicinal, sem o juridiquês',
    excerpt: 'A RDC 1.015 reorganiza o caminho das prescrições. Entenda o que continua igual, o que mudou e onde ainda há incerteza.',
    date: '12 mar 2026',
    readTime: '8 min',
    author: 'Lívia Sampaio',
    accent: 'coral',
    icon: 'policy',
    featured: true,
  },
  {
    id: 2,
    category: 'Ciência',
    eyebrow: 'Laboratório aberto',
    title: 'Bebidas de cannabis: o que a evidência independente consegue dizer',
    excerpt: 'Promessas de efeito rápido esbarram em doses, absorção e estudos que ainda não conversam entre si.',
    date: '08 mar 2026',
    readTime: '6 min',
    author: 'Caio Nóbrega',
    accent: 'lime',
    icon: 'science',
  },
  {
    id: 3,
    category: 'Saúde',
    eyebrow: 'Pergunta honesta',
    title: 'CBD faz mal ao fígado? Como ler os estudos de segurança',
    excerpt: 'A resposta curta depende da dose. A longa passa por interações, acompanhamento e por uma distinção que quase sempre some na manchete.',
    date: '02 mar 2026',
    readTime: '10 min',
    author: 'Marina Tavares',
    accent: 'sky',
    icon: 'health',
  },
  {
    id: 4,
    category: 'História',
    eyebrow: 'Arquivo vivo',
    title: 'Na China antiga, a cannabis era um dos cinco grãos',
    excerpt: 'Muito antes dos debates atuais, sementes de cânhamo faziam parte da despensa e da imaginação agrícola chinesa.',
    date: '25 fev 2026',
    readTime: '7 min',
    author: 'Bia Campelo',
    accent: 'amber',
    icon: 'history',
  },
  {
    id: 5,
    category: 'Ciência',
    eyebrow: 'Ferramentas para curiosos',
    title: 'Um guia prático para não se perder lendo pesquisa sobre cannabis',
    excerpt: 'Amostra, desfecho, controle, conflito de interesse: um mapa de bolso para atravessar um paper sem cair na conclusão fácil.',
    date: '18 fev 2026',
    readTime: '12 min',
    author: 'Caio Nóbrega',
    accent: 'violet',
    icon: 'science',
  },
  {
    id: 6,
    category: 'Cultura',
    eyebrow: 'Vocabulário essencial',
    title: 'CBD, THC e canabinoides menores: não é tudo a mesma coisa',
    excerpt: 'Uma conversa clara sobre moléculas, efeitos e por que “cannabis” é um nome grande demais para caber em uma só promessa.',
    date: '10 fev 2026',
    readTime: '5 min',
    author: 'Lívia Sampaio',
    accent: 'rose',
    icon: 'culture',
  },
];

const categories: { label: Category; icon?: typeof Leaf }[] = [
  { label: 'Todos' },
  { label: 'Ciência', icon: FlaskConical },
  { label: 'Saúde', icon: HeartPulse },
  { label: 'Política', icon: Landmark },
  { label: 'História', icon: History },
  { label: 'Cultura', icon: Leaf },
];

function ArticleIcon({ kind }: { kind: Article['icon'] }) {
  const Icon = kind === 'science' ? FlaskConical : kind === 'health' ? HeartPulse : kind === 'policy' ? Landmark : kind === 'history' ? History : Leaf;
  return <Icon size={17} strokeWidth={1.7} />;
}

function MarkButton({ saved, onClick, id }: { saved: boolean; onClick: () => void; id: number }) {
  return (
    <button
      type="button"
      aria-label={saved ? 'Remover dos salvos' : 'Salvar artigo'}
      data-testid={`button-bookmark-${id}`}
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      className={`group/mark inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${saved ? 'border-[#d4e66a] bg-[#d4e66a] text-[#17352f]' : 'border-[#d8d4c8] bg-[#f5f1e6]/70 text-[#52635e] hover:border-[#17352f] hover:text-[#17352f]'}`}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.7} />
    </button>
  );
}

function ArtPanel({ article, large = false }: { article: Article; large?: boolean }) {
  return (
    <div className={`relative isolate overflow-hidden ${large ? 'min-h-[350px] md:min-h-[455px]' : 'min-h-[190px]'} art-${article.accent}`}>
      <div className="absolute inset-0 opacity-90" />
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border-[1.5px] border-current/25" />
      <div className="absolute -right-4 top-0 h-56 w-56 rounded-full border-[1.5px] border-current/20" />
      <div className="absolute bottom-[-3.5rem] left-[-2.5rem] h-40 w-40 rotate-12 rounded-[50%_0_50%_0] border border-current/25" />
      <div className={`absolute ${large ? 'right-[18%] top-[25%] h-32 w-24 md:h-44 md:w-32' : 'right-[17%] top-[23%] h-24 w-20'} rotate-[-22deg] rounded-[65%_35%_60%_40%] border-2 border-current/60`}>
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-[19deg] bg-current/45" />
        <span className="absolute left-[-5%] top-[35%] h-px w-[110%] rotate-[22deg] bg-current/35" />
        <span className="absolute left-[-3%] top-[62%] h-px w-[106%] rotate-[18deg] bg-current/35" />
      </div>
      <div className="absolute bottom-5 left-5 font-mono-editorial text-[10px] uppercase tracking-[.22em] opacity-65">arquivo / 2026</div>
      <div className={`absolute right-5 font-display text-[7rem] leading-none opacity-15 ${large ? 'top-5 md:text-[11rem]' : 'top-3 text-[7rem]'}`}>T</div>
    </div>
  );
}

function ArticleCard({ article, saved, onSave, onOpen, featured = false }: { article: Article; saved: boolean; onSave: () => void; onOpen: () => void; featured?: boolean }) {
  return (
    <article
      data-testid={`card-article-${article.id}`}
      onClick={onOpen}
      className={`group cursor-pointer overflow-hidden rounded-[2px] border border-[#d8d4c8] bg-[#f8f4eb] transition-all duration-500 hover:-translate-y-1 hover:border-[#17352f]/45 hover:shadow-[0_18px_34px_rgba(23,53,47,.12)] ${featured ? 'md:grid md:grid-cols-[1.05fr_.95fr]' : ''}`}
    >
      <ArtPanel article={article} large={featured} />
      <div className={`${featured ? 'p-6 md:p-8' : 'p-5'} flex flex-col`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-mono-editorial text-[10px] uppercase tracking-[.16em] text-[#8d5b4e]">
            <ArticleIcon kind={article.icon} /> {article.category}
          </span>
          <MarkButton saved={saved} onClick={onSave} id={article.id} />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.11em] text-[#76827a]">{article.eyebrow}</p>
        <h3 className={`font-display leading-[1.05] text-[#17352f] ${featured ? 'text-3xl md:text-[2.65rem]' : 'text-[1.55rem]'}`}>{article.title}</h3>
        <p className={`mt-4 leading-relaxed text-[#5b6a65] ${featured ? 'max-w-[43rem] text-base' : 'text-sm'}`}>{article.excerpt}</p>
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-[#d8d4c8] pt-5 text-xs text-[#76827a]">
          <span>{article.author} · {article.date}</span>
          <span className="flex shrink-0 items-center gap-1 font-mono-editorial text-[10px] uppercase tracking-wider"><Clock3 size={13} /> {article.readTime}</span>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#17352f] opacity-70 transition-all group-hover:gap-2 group-hover:opacity-100">Ler o texto <ArrowUpRight size={14} /></div>
      </div>
    </article>
  );
}

function ArticleModal({ article, saved, onSave, onClose }: { article: Article; saved: boolean; onSave: () => void; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" data-testid="modal-article" className="fixed inset-0 z-40 flex items-end justify-center bg-[#17352f]/65 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto bg-[#f8f4eb] shadow-2xl">
        <button type="button" data-testid="button-close-article" onClick={onClose} aria-label="Fechar artigo" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d4c8] bg-[#f8f4eb] text-[#17352f] transition hover:bg-[#d4e66a]"><X size={19} /></button>
        <div className="grid md:grid-cols-[.72fr_1.28fr]">
          <ArtPanel article={article} large />
          <div className="p-7 md:p-12">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono-editorial text-[10px] uppercase tracking-[.16em] text-[#8d5b4e]">{article.category} / {article.date}</p>
              <MarkButton saved={saved} onClick={onSave} id={article.id} />
            </div>
            <p className="mt-9 text-xs font-semibold uppercase tracking-[.12em] text-[#76827a]">{article.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-[.99] text-[#17352f] md:text-6xl">{article.title}</h2>
            <p className="mt-6 text-lg leading-relaxed text-[#5b6a65]">{article.excerpt}</p>
            <div className="mt-7 flex items-center gap-3 border-y border-[#d8d4c8] py-4 text-xs text-[#52635e]"><span className="font-semibold text-[#17352f]">{article.author}</span><span className="h-1 w-1 rounded-full bg-[#d38b76]" /><span>{article.readTime} de leitura</span></div>
            <div className="prose prose-lg mt-8 max-w-none prose-headings:font-display prose-headings:text-[#17352f] prose-p:text-[#4f625c] prose-strong:text-[#17352f]">
              <p>Quando uma conversa cresce rápido, a primeira coisa que costuma desaparecer é o contexto. É por isso que este texto começa pelo começo: o que sabemos, o que parece provável e onde a ciência ainda pede calma.</p>
              <p>Em vez de transformar um estudo em promessa, olhamos para o desenho da pesquisa, para as pessoas que participaram e para a diferença entre um resultado estatístico e uma mudança que alguém sente no cotidiano.</p>
              <blockquote>“Boa informação não tira a dúvida à força. Ela mostra como fazer perguntas melhores.”</blockquote>
              <p>O objetivo aqui não é entregar uma resposta pronta para todo mundo. É oferecer uma leitura segura para você conversar com profissionais, reconhecer exageros e decidir o próximo passo com mais autonomia.</p>
              <p className="font-mono-editorial !text-xs uppercase !tracking-[.12em] !text-[#8d5b4e]">Conteúdo educativo. Não substitui avaliação profissional.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-logo">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d4e66a] bg-[#d4e66a] font-display text-xl text-[#17352f]">T</div>
      {!compact && <div className="leading-none"><p className="font-display text-[1.55rem] tracking-[-.04em] text-[#17352f]">Tudo Sobre</p><p className="font-mono-editorial mt-1 text-[9px] uppercase tracking-[.24em] text-[#8d5b4e]">cannabis</p></div>}
    </div>
  );
}

function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [email, setEmail] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [toast, setToast] = useState('');

  const filteredArticles = useMemo(() => articles.filter((article) => {
    const matchesCategory = activeCategory === 'Todos' || article.category === activeCategory;
    const haystack = `${article.title} ${article.excerpt} ${article.category}`.toLocaleLowerCase('pt-BR');
    return matchesCategory && (!query.trim() || haystack.includes(query.toLocaleLowerCase('pt-BR')));
  }), [activeCategory, query]);

  const toggleSave = (id: number) => {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      setToast(current.includes(id) ? 'Removido dos seus textos salvos' : 'Texto salvo para ler depois');
      window.setTimeout(() => setToast(''), 2400);
      return next;
    });
  };

  const handleNewsletter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setNewsletterSent(true);
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="editorial-noise min-h-[100dvh] bg-[#f1ede2] text-[#17352f]">
      <div className="bg-[#17352f] px-5 py-2 text-center font-mono-editorial text-[9px] uppercase tracking-[.18em] text-[#d4e66a]">Edição 04 · 2026 — informação para cultivar autonomia</div>
      <header className="sticky top-0 z-30 border-b border-[#d8d4c8] bg-[#f1ede2]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-4 lg:px-8">
          <button type="button" onClick={() => scrollTo('inicio')} className="text-left"><Logo /></button>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
            {categories.slice(1).map(({ label }) => <button key={label} type="button" data-testid={`nav-category-${label.toLowerCase()}`} onClick={() => { setActiveCategory(label); scrollTo('leituras'); }} className="font-mono-editorial text-[10px] uppercase tracking-[.13em] text-[#52635e] transition hover:text-[#8d5b4e]">{label}</button>)}
            <button type="button" data-testid="button-nav-about" onClick={() => scrollTo('sobre')} className="font-mono-editorial text-[10px] uppercase tracking-[.13em] text-[#52635e] transition hover:text-[#8d5b4e]">Sobre</button>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" data-testid="button-header-search" onClick={() => scrollTo('leituras')} aria-label="Buscar artigos" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d4c8] text-[#17352f] transition hover:border-[#17352f] hover:bg-[#d4e66a]"><Search size={17} /></button>
            <button type="button" data-testid="button-mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17352f] text-[#f1ede2] lg:hidden">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-[#d8d4c8] bg-[#ebe5d7] px-5 py-4 lg:hidden">{categories.map(({ label, icon: Icon }) => <button key={label} type="button" data-testid={`mobile-category-${label.toLowerCase()}`} onClick={() => { setActiveCategory(label); scrollTo('leituras'); }} className="flex w-full items-center justify-between border-b border-[#d8d4c8] py-3 text-left font-mono-editorial text-[11px] uppercase tracking-[.14em] text-[#17352f]">{label}{Icon && <Icon size={16} />}</button>)}<button type="button" onClick={() => scrollTo('sobre')} className="flex w-full items-center justify-between py-3 text-left font-mono-editorial text-[11px] uppercase tracking-[.14em]">Sobre <ChevronRight size={16} /></button></div>}
      </header>

      <main id="inicio">
        <section className="relative overflow-hidden bg-[#17352f] text-[#f1ede2]">
          <div className="absolute -right-32 top-16 h-96 w-96 rounded-full border border-[#d4e66a]/20 md:h-[34rem] md:w-[34rem]" />
          <div className="absolute -right-10 top-32 h-72 w-72 rounded-full border border-[#d4e66a]/15 md:h-[25rem] md:w-[25rem]" />
          <div className="mx-auto max-w-[1320px] px-5 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="grid items-end gap-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-20">
              <div className="relative z-10">
                <div className="reveal mb-7 flex items-center gap-3 font-mono-editorial text-[10px] uppercase tracking-[.2em] text-[#d4e66a]"><span className="h-px w-10 bg-[#d4e66a]" /> Um portal para entender melhor</div>
                <h1 className="reveal reveal-delay-1 max-w-3xl font-display text-[3.85rem] leading-[.88] tracking-[-.055em] text-[#f1ede2] sm:text-7xl md:text-[7.4rem]">Nem precisa<br /><span className="text-[#d4e66a]">perguntar.</span></h1>
                <p className="reveal reveal-delay-2 mt-8 max-w-md text-lg leading-relaxed text-[#c4cec2]">A gente explica cannabis com ciência, contexto e uma dose saudável de curiosidade.</p>
                <div className="reveal reveal-delay-3 mt-9 flex flex-wrap items-center gap-4"><button type="button" data-testid="button-hero-read" onClick={() => { setSelectedArticle(articles[0]); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group flex items-center gap-3 bg-[#d4e66a] px-5 py-3 text-sm font-semibold text-[#17352f] transition hover:bg-[#f1ede2]">Comece por aqui <ArrowUpRight size={16} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" /></button><button type="button" data-testid="button-hero-explore" onClick={() => scrollTo('leituras')} className="flex items-center gap-2 px-2 py-3 text-sm text-[#c4cec2] transition hover:text-[#d4e66a]">Explorar leituras <ChevronRight size={16} /></button></div>
              </div>
              <div className="relative z-10 lg:pb-1">
                <div className="mb-4 flex items-center justify-between font-mono-editorial text-[10px] uppercase tracking-[.16em] text-[#9eaea0]"><span>Na mesa da redação</span><span>01 — 06</span></div>
                <button type="button" data-testid="card-hero-article" onClick={() => setSelectedArticle(articles[0])} className="group block w-full text-left">
                  <div className="relative overflow-hidden border border-[#547068] bg-[#2b5148] p-4 transition group-hover:border-[#d4e66a]">
                    <div className="grid gap-7 sm:grid-cols-[.8fr_1.2fr] sm:items-center"><div className="relative flex aspect-[.84] items-center justify-center overflow-hidden bg-[#c77867]"><div className="absolute h-44 w-44 rounded-full border border-[#f1ede2]/40" /><div className="absolute h-32 w-32 rounded-full border border-[#f1ede2]/30" /><div className="absolute h-24 w-16 rotate-[27deg] rounded-[60%_40%_55%_45%] border-2 border-[#f1ede2]/75" /><span className="absolute bottom-4 left-4 font-mono-editorial text-[9px] uppercase tracking-widest text-[#f1ede2]">RDC 1.015</span></div><div className="py-2 pr-2"><p className="font-mono-editorial text-[10px] uppercase tracking-[.16em] text-[#d4e66a]">Política / em destaque</p><h2 className="mt-4 font-display text-3xl leading-[1.03] text-[#f1ede2] md:text-4xl">A nova regra da Anvisa para cannabis medicinal, sem o juridiquês</h2><p className="mt-5 text-sm leading-relaxed text-[#c4cec2]">O que muda para quem tem receita, para quem prescreve e para quem ainda está tentando entender o caminho.</p><div className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#d4e66a]">Ler análise <ArrowUpRight size={14} /></div></div></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="leituras" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-between gap-8 border-b border-[#cfc9bb] pb-7 md:flex-row md:items-end">
            <div><p className="font-mono-editorial text-[10px] uppercase tracking-[.2em] text-[#8d5b4e]">Arquivo recente</p><h2 className="mt-3 font-display text-5xl leading-none tracking-[-.04em] md:text-6xl">Leituras que<br />ficam na cabeça.</h2></div>
            <div className="flex w-full max-w-sm items-center gap-3 border-b border-[#17352f] pb-2"><Search size={18} className="shrink-0 text-[#8d5b4e]" /><input data-testid="input-search-articles" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tema ou palavra" className="w-full bg-transparent text-sm text-[#17352f] outline-none placeholder:text-[#8a938b]" /></div>
          </div>
          <div className="no-scrollbar mt-7 flex gap-2 overflow-x-auto pb-1">{categories.map(({ label, icon: Icon }) => <button key={label} type="button" data-testid={`filter-category-${label.toLowerCase()}`} onClick={() => setActiveCategory(label)} className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${activeCategory === label ? 'border-[#17352f] bg-[#17352f] text-[#f1ede2]' : 'border-[#cfc9bb] text-[#52635e] hover:border-[#17352f]'}`}>{Icon && <Icon size={14} />}{label}</button>)}</div>
          <div className="mt-9">{filteredArticles.length > 0 ? <div className="grid gap-5 md:grid-cols-2"><div className="md:col-span-2"><ArticleCard article={filteredArticles[0]} featured saved={saved.includes(filteredArticles[0].id)} onSave={() => toggleSave(filteredArticles[0].id)} onOpen={() => setSelectedArticle(filteredArticles[0])} /></div>{filteredArticles.slice(1).map((article) => <ArticleCard key={article.id} article={article} saved={saved.includes(article.id)} onSave={() => toggleSave(article.id)} onOpen={() => setSelectedArticle(article)} />)}</div> : <div data-testid="empty-search-state" className="border border-dashed border-[#b9b2a3] bg-[#ebe5d7] px-6 py-20 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#d4e66a] text-[#17352f]"><Search size={22} /></div><h3 className="mt-5 font-display text-3xl">Nada encontrado ainda.</h3><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#62716a]">Tente outra palavra, ou volte para todos os textos. Às vezes a melhor busca começa com uma pergunta diferente.</p><button type="button" data-testid="button-clear-search" onClick={() => { setQuery(''); setActiveCategory('Todos'); }} className="mt-6 border-b border-[#17352f] pb-1 text-sm font-semibold">Ver todas as leituras</button></div>}</div>
        </section>

        <section id="sobre" className="scroll-mt-24 border-y border-[#cfc9bb] bg-[#e6dfd0]">
          <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-20 lg:grid-cols-[.7fr_1.3fr] lg:items-center lg:px-8 lg:py-28">
            <div className="relative min-h-[260px] overflow-hidden bg-[#c77867] p-7 text-[#f1ede2]"><div className="absolute -right-12 -top-10 h-60 w-60 rounded-full border border-[#f1ede2]/35" /><div className="absolute bottom-[-4rem] left-[-2rem] h-44 w-44 rounded-full border border-[#17352f]/30" /><div className="relative flex h-full flex-col justify-between"><span className="font-mono-editorial text-[10px] uppercase tracking-[.2em]">Carta da redação</span><span className="font-display text-[4.4rem] leading-[.8] tracking-[-.06em]">02<br /><em className="text-[#d4e66a]">coisas</em><br />podem ser verdade.</span></div></div>
            <div><p className="font-mono-editorial text-[10px] uppercase tracking-[.2em] text-[#8d5b4e]">Por que existimos</p><h2 className="mt-4 max-w-2xl font-display text-5xl leading-[.95] tracking-[-.045em] md:text-7xl">Curiosidade sem<br /><span className="text-[#8d5b4e]">pânico moral.</span></h2><p className="mt-7 max-w-xl text-lg leading-relaxed text-[#52635e]">Tudo Sobre Cannabis nasceu de uma vontade simples: trocar a pressa da manchete por uma conversa bem feita. Somos uma publicação independente sobre a planta, as pessoas e as perguntas que ela coloca no mundo.</p><div className="mt-9 grid max-w-xl gap-6 border-t border-[#b9b2a3] pt-6 sm:grid-cols-2"><div><p className="font-display text-3xl">Contexto</p><p className="mt-2 text-sm leading-relaxed text-[#62716a]">A notícia é o ponto de partida, não o ponto final.</p></div><div><p className="font-display text-3xl">Cuidado</p><p className="mt-2 text-sm leading-relaxed text-[#62716a]">Informação responsável também sabe dizer “ainda não sabemos”.</p></div></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-5 py-20 lg:px-8 lg:py-28"><div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]"><div><p className="font-mono-editorial text-[10px] uppercase tracking-[.2em] text-[#8d5b4e]">Uma ferramenta editorial</p><h2 className="mt-4 max-w-2xl font-display text-5xl leading-[.96] tracking-[-.04em] md:text-7xl">Leia qualquer pesquisa<br /><span className="text-[#8d5b4e]">com mais calma.</span></h2><p className="mt-6 max-w-lg text-base leading-relaxed text-[#62716a]">Antes de compartilhar uma conclusão, passe por quatro perguntas. Elas cabem na margem de um caderno e evitam muita confusão.</p></div><div className="border-l border-[#cfc9bb] pl-6 md:pl-10"><div className="space-y-5">{['Quem participou do estudo?', 'O que foi medido de verdade?', 'Existe um grupo de comparação?', 'Quem pagou por esta pesquisa?'].map((question, index) => <div key={question} className="group flex gap-4 border-b border-[#cfc9bb] pb-5"><span className="font-mono-editorial text-[10px] text-[#c77867]">0{index + 1}</span><p className="font-display text-2xl leading-tight transition group-hover:text-[#8d5b4e]">{question}</p></div>)}</div><button type="button" data-testid="button-read-guide" onClick={() => setSelectedArticle(articles[4])} className="mt-7 flex items-center gap-2 text-sm font-semibold text-[#17352f]">Ler o guia completo <ArrowUpRight size={15} /></button></div></div></section>

        <section className="bg-[#17352f] px-5 py-20 text-[#f1ede2] lg:px-8 lg:py-24"><div className="mx-auto grid max-w-[1320px] items-end gap-12 lg:grid-cols-[.85fr_1.15fr]"><div><p className="font-mono-editorial text-[10px] uppercase tracking-[.2em] text-[#d4e66a]">Uma carta por semana</p><h2 className="mt-4 max-w-md font-display text-5xl leading-[.95] tracking-[-.045em] md:text-7xl">Menos ruído.<br /><span className="text-[#d4e66a]">Mais contexto.</span></h2><p className="mt-6 max-w-sm leading-relaxed text-[#b9c8bb]">Os melhores textos da semana, uma pergunta boa e nenhum spam. Direto na sua caixa de entrada.</p></div><div className="border-t border-[#547068] pt-7">{newsletterSent ? <div data-testid="status-newsletter-success" className="flex items-center gap-4 border border-[#547068] bg-[#21433b] p-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4e66a] text-[#17352f]"><Check size={19} /></div><div><p className="font-display text-2xl text-[#f1ede2]">Anotado.</p><p className="mt-1 text-sm text-[#b9c8bb]">A próxima carta encontra você por aqui.</p></div></div> : <form onSubmit={handleNewsletter} className="flex flex-col gap-4 sm:flex-row"><label className="sr-only" htmlFor="newsletter-email">Seu melhor e-mail</label><div className="flex flex-1 items-center gap-3 border-b border-[#9eaea0] py-3"><Mail size={18} className="text-[#d4e66a]" /><input id="newsletter-email" data-testid="input-newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu melhor e-mail" className="w-full bg-transparent text-[#f1ede2] outline-none placeholder:text-[#9eaea0]" /></div><button type="submit" data-testid="button-newsletter-submit" className="flex items-center justify-center gap-2 bg-[#d4e66a] px-6 py-3 text-sm font-semibold text-[#17352f] transition hover:bg-[#f1ede2]">Assinar a carta <Send size={15} /></button></form>}<p className="mt-5 font-mono-editorial text-[9px] uppercase tracking-[.16em] text-[#778d81]">Leitura livre · sair quando quiser · feito no Brasil</p></div></div></section>
      </main>

      <footer className="bg-[#ebe5d7] px-5 py-10 lg:px-8"><div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 md:flex-row md:items-end"><div><Logo /><p className="mt-5 max-w-xs text-sm leading-relaxed text-[#62716a]">Uma publicação independente para falar de cannabis com a cabeça aberta e os pés no chão.</p></div><div className="flex flex-col items-start gap-3 text-sm text-[#52635e] md:items-end"><button type="button" data-testid="button-footer-top" onClick={() => scrollTo('inicio')} className="flex items-center gap-2 transition hover:text-[#8d5b4e]">Voltar ao começo <ArrowUpRight size={14} /></button><span className="font-mono-editorial text-[9px] uppercase tracking-[.14em] text-[#8a938b]">© 2026 Tudo Sobre Cannabis</span></div></div></footer>
      {toast && <div data-testid="status-toast" className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 bg-[#17352f] px-5 py-3 text-sm text-[#f1ede2] shadow-xl">{toast}</div>}
      {selectedArticle && <ArticleModal article={selectedArticle} saved={saved.includes(selectedArticle.id)} onSave={() => toggleSave(selectedArticle.id)} onClose={() => setSelectedArticle(null)} />}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;