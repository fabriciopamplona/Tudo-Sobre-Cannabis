import { ArrowLeft, ArrowUpRight, Bookmark, Clock3, Share2 } from 'lucide-react';
import './_group.css';

export function ArticleTemplate() {
  return (
    <main className="article-template">
      <header className="border-b border-[#d8d4c8] px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button className="article-mono flex items-center gap-2 text-[10px] text-[#62716a]">
            <ArrowLeft size={14} /> voltar ao arquivo
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4e66a] font-['Fraunces'] text-lg">T</div>
            <span className="article-display hidden text-xl tracking-[-.04em] sm:block">Tudo Sobre</span>
          </div>
          <button aria-label="Compartilhar artigo" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d4c8] transition hover:bg-[#d4e66a]">
            <Share2 size={15} />
          </button>
        </div>
      </header>

      <section className="px-6 pb-12 pt-14 md:px-10 md:pb-16 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
            <div>
              <p className="article-mono text-[10px] text-[#8d5b4e]">Política · 19 jun 2026</p>
              <h1 className="article-display mt-5 max-w-2xl text-5xl leading-[.95] tracking-[-.045em] md:text-7xl">
                RDC 1.015: como a nova regra da Anvisa muda a prescrição de cannabis medicinal no Brasil
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#62716a]">
                Receita branca, novos prescritores e manipulação de CBD: o que realmente mudou — e o que ainda precisa de contexto.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-[#d8d4c8] py-4 text-xs text-[#62716a]">
                <span className="font-semibold text-[#17352f]">Por Fabricio Pamplona</span>
                <span className="flex items-center gap-1"><Clock3 size={13} /> 6 min de leitura</span>
                <button className="flex items-center gap-1 transition hover:text-[#8d5b4e]"><Bookmark size={13} /> salvar</button>
              </div>
            </div>

            <div className="relative min-h-[330px] overflow-hidden bg-[#c77867] p-8 text-[#f8f4eb] md:min-h-[410px]">
              <div className="absolute -right-16 -top-20 h-80 w-80 rounded-full border border-[#f8f4eb]/30" />
              <div className="absolute bottom-[-5rem] left-[-2rem] h-64 w-64 rounded-full border border-[#17352f]/30" />
              <div className="relative flex h-full min-h-[275px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="article-mono text-[10px]">análise 01 / 06</span>
                  <ArrowUpRight size={22} />
                </div>
                <div>
                  <div className="mb-8 h-px w-full bg-[#f8f4eb]/45" />
                  <p className="article-display max-w-md text-4xl leading-none md:text-5xl">O que muda para quem precisa de informação sem juridiquês.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-12 border-t border-[#d8d4c8] pt-12 lg:grid-cols-[1fr_230px] lg:gap-20">
            <article className="article-prose max-w-2xl">
              <p className="!mt-0 font-semibold !text-[#17352f]">A mudança chegou com uma promessa de simplificação. Mas, para entender o que muda na prática, vale separar o texto da norma daquilo que já pode acontecer no consultório.</p>
              <p>Quando uma regra nova entra em vigor, a manchete costuma correr mais rápido que a interpretação. A RDC 1.015 reorganiza pontos importantes da prescrição de produtos de cannabis, mas não transforma todas as dúvidas em respostas prontas.</p>
              <blockquote>“Boa informação não tira a dúvida à força. Ela mostra como fazer perguntas melhores.”</blockquote>
              <p>O primeiro ponto é a receita. A mudança no modelo do receituário altera o caminho burocrático, mas não elimina a necessidade de avaliação profissional, acompanhamento e responsabilidade na escolha do produto.</p>
              <p><strong>O que vale guardar:</strong> uma regra mais clara pode facilitar o acesso, mas acesso não é sinônimo de indicação. A conversa com o profissional continua sendo parte central do cuidado.</p>
              <p className="article-mono !mt-10 !text-[10px] !text-[#8d5b4e]">Conteúdo educativo · não substitui avaliação profissional</p>
            </article>

            <aside className="h-fit border-t border-[#d8d4c8] pt-4 lg:sticky lg:top-8">
              <p className="article-mono text-[10px] text-[#8d5b4e]">Neste texto</p>
              <nav className="mt-4 space-y-3 text-sm text-[#62716a]">
                <a className="block transition hover:text-[#17352f]" href="#receita">A mudança na receita</a>
                <a className="block transition hover:text-[#17352f]" href="#prescritores">Quem pode prescrever</a>
                <a className="block transition hover:text-[#17352f]" href="#guardar">O que guardar</a>
              </nav>
              <div className="mt-10 border-t border-[#d8d4c8] pt-4">
                <p className="article-mono text-[10px] text-[#8d5b4e]">Leia também</p>
                <p className="article-display mt-3 text-2xl leading-tight">Como ler uma pesquisa sobre cannabis sem cair em promessas fáceis.</p>
                <ArrowUpRight className="mt-4 text-[#8d5b4e]" size={18} />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}