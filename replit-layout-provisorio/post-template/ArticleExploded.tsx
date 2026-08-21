import { ArrowLeft, Bookmark, Check, Clock3, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import './_group.css';
import './ArticleExploded.css';

export function ArticleExploded() {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  const shareArticle = async () => {
    setShared(true);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText('RDC 1.015: como a nova regra da Anvisa muda a prescrição de cannabis medicinal no Brasil');
    }
    window.setTimeout(() => setShared(false), 2200);
  };

  return (
    <main className="article-exploded">
      <header className="relative z-10 flex items-center justify-between border-b border-[#d8d4c8] px-5 py-5 md:px-10">
        <button className="article-mono flex items-center gap-2 text-[10px] text-[#62716a] transition hover:text-[#17352f]" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowLeft size={14} /> voltar ao arquivo
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4e66a] font-['Fraunces'] text-lg text-[#17352f]">T</div>
          <span className="article-display text-xl tracking-[-.04em]">Tudo Sobre Cannabis</span>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label={saved ? 'Artigo salvo' : 'Salvar artigo'} className={`flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d4c8] transition hover:bg-[#d4e66a] ${saved ? 'bg-[#d4e66a]' : ''}`} onClick={() => setSaved(!saved)}>
            {saved ? <Check size={15} /> : <Bookmark size={15} />}
          </button>
          <button aria-label="Compartilhar artigo" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d4c8] transition hover:bg-[#d4e66a]" onClick={shareArticle}>
            {shared ? <Copy size={15} /> : <Share2 size={15} />}
          </button>
        </div>
      </header>

      <section className="relative px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <div className="exploded-ghost" aria-hidden="true">T</div>
        <div className="exploded-ring" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl">
          <div className="ml-auto max-w-[52rem]">
            <div className="article-mono flex flex-wrap items-center gap-3 text-[10px] text-[#8d5b4e]">
              <span className="text-[#17352f]">Política</span><span className="text-[#b1a99c]">/</span><span>19 jun 2026</span><span className="text-[#b1a99c]">/</span><span>análise 01</span>
            </div>
            <p className="article-mono mt-14 text-[10px] text-[#17352f]">O que muda na prática</p>
            <h1 className="article-display mt-5 max-w-4xl text-[3.35rem] leading-[.92] tracking-[-.055em] md:text-[6.8rem]">
              A nova regra da Anvisa para cannabis medicinal, sem o juridiquês
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-[1.65] text-[#62716a] md:text-xl">
              A RDC 1.015 reorganiza o caminho das prescrições. Entenda o que continua igual, o que mudou e onde ainda há incerteza.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-[#d8d4c8] py-4 text-xs text-[#62716a]">
              <span className="font-semibold text-[#17352f]">Por Fabricio Pamplona</span>
              <span className="flex items-center gap-1"><Clock3 size={13} /> 6 min de leitura</span>
              <span className="text-[#b1a99c]">{saved ? 'salvo no seu arquivo' : 'leitura independente'}</span>
            </div>
          </div>

          <div className="mt-20 grid gap-14 border-t border-[#d8d4c8] pt-10 md:mt-28 md:grid-cols-[minmax(0,1fr)_12rem] md:gap-24">
            <article className="exploded-prose max-w-[43rem] md:ml-auto">
              <p className="font-semibold !text-[#17352f]">Quando uma conversa cresce rápido, a primeira coisa que costuma desaparecer é o contexto. É por isso que este texto começa pelo começo: o que sabemos, o que parece provável e onde a ciência ainda pede calma.</p>
              <p>Em vez de transformar uma norma em promessa, vamos olhar para as mudanças com a distância necessária. A RDC 1.015 reorganiza pontos importantes da prescrição de produtos de cannabis, mas não transforma todas as dúvidas em respostas prontas.</p>
              <blockquote>“Boa informação não tira a dúvida à força. Ela mostra como fazer perguntas melhores.”</blockquote>
              <p id="receita">O primeiro ponto é a receita. A mudança no modelo do receituário altera o caminho burocrático, mas não elimina a necessidade de avaliação profissional, acompanhamento e responsabilidade na escolha do produto.</p>
              <p id="prescritores">Também muda o mapa de quem pode prescrever. A regra abre espaço para mais profissionais habilitados, sem tirar do centro a conversa clínica, o histórico de cada pessoa e a decisão compartilhada.</p>
              <p id="guardar"><strong>O que vale guardar:</strong> uma regra mais clara pode facilitar o acesso, mas acesso não é sinônimo de indicação. A conversa com o profissional continua sendo parte central do cuidado.</p>
              <p className="article-mono !mt-12 !text-[10px] !text-[#17352f]">Conteúdo educativo · não substitui avaliação profissional</p>
            </article>

            <aside className="h-fit border-t border-[#d8d4c8] pt-4 md:sticky md:top-8">
              <p className="article-mono text-[10px] text-[#17352f]">Neste texto</p>
              <nav className="mt-4 space-y-3 text-sm text-[#62716a]">
                <a className="exploded-link block" href="#receita">A mudança na receita</a>
                <a className="exploded-link block" href="#prescritores">Quem pode prescrever</a>
                <a className="exploded-link block" href="#guardar">O que guardar</a>
              </nav>
              <div className="mt-10 border-t border-[#d8d4c8] pt-4">
                <p className="article-mono text-[10px] text-[#17352f]">Leia também</p>
                <p className="article-display mt-3 text-2xl leading-tight">Como ler uma pesquisa sobre cannabis sem cair em promessas fáceis.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <footer className="border-t border-[#d8d4c8] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-[#62716a]">
          <span className="article-mono text-[10px]">Tudo Sobre Cannabis</span>
          <span>Informação para ficar por dentro.</span>
        </div>
      </footer>
    </main>
  );
}