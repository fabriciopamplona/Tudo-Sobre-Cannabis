import type { Metadata } from "next";
import Link from "next/link";
import { EDITOR, LINKS, SITE_TAGLINE } from "@/lib/authors";

export const metadata: Metadata = {
  title: "Sobre o Tudo Sobre Cannabis",
  description:
    "Publicação independente sobre cannabis: ciência, saúde, regulação, mercado e cultura. Nem precisa perguntar, a gente explica.",
};

export default function SobrePage() {
  return (
    <div className="page-intro wrap">
      <p className="kicker">Expediente</p>
      <h1>{SITE_TAGLINE}</h1>
      <div className="prose-editorial">
        <h2>Sobre o blog</h2>
        <p>
          O Tudo Sobre Cannabis é um veículo editorial sobre cannabis: ciência,
          regulação, mercado, política e cultura, editado por{" "}
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
            {EDITOR.handle}
          </a>
          . Dr. Fabricio Pamplona é farmacêutico, doutor em Farmacologia pela UFSC
          e trabalha com canabinoides há mais de duas décadas, entre pesquisa
          científica, educação e liderança de empresas da área. Assina o
          editorial do Tudo Sobre Cannabis e a{" "}
          <a href={LINKS.substack} target="_blank" rel="noopener noreferrer">
            newsletter homônima no Substack
          </a>
          .
        </p>
        <p>
          A proposta é quebrar tabus e cultivar mentes abertas, trazer clareza pra
          esse tema sem hype, sem moralismo e sem o discurso apaixonado do
          ativismo. Nosso objetivo é informar e inspirar, sem pressa, com o tom de
          uma conversa inteligente e com olhar científico.
        </p>
        <p>
          O trabalho não termina em relatar o fato. Queremos aprofundar no porquê
          e esclarecer os temas mais complexos falando de maneira simples. Siga se
          você quer ter acesso a conteúdo ponta firme, para quem quer entender de
          verdade sobre esse universo.
        </p>
        <p>
          Acompanhe o editor em{" "}
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
            {EDITOR.handle}
          </a>
          , o perfil em{" "}
          <a href={LINKS.editorSite} target="_blank" rel="noopener noreferrer">
            fabriciopamplona.com.br
          </a>{" "}
          e a{" "}
          <a href={LINKS.substack} target="_blank" rel="noopener noreferrer">
            newsletter do Tudo sobre Cannabis no Substack
          </a>
          .
        </p>
        <p>
          <Link href="/">Voltar à capa</Link>
        </p>
      </div>
    </div>
  );
}
