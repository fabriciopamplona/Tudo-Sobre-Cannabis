import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre o Tudo Sobre Cannabis",
  description:
    "Veículo editorial de cannabis: ciência, regulação, mercado e cultura. Nem precisa perguntar, a gente explica.",
};

export default function SobrePage() {
  return (
    <div className="page-intro wrap">
      <p className="kicker">Expediente</p>
      <h1>Nem precisa perguntar, a gente explica.</h1>
      <div className="prose-editorial">
        <p>
          O Tudo Sobre Cannabis não é um agregador, nem assessoria, nem o blog
          de uma empresa. É um veículo para entender a cannabis como fenômeno
          científico, médico, regulatório, econômico, político e cultural.
        </p>
        <p>
          O trabalho não termina em “o que aconteceu”. Queremos o porquê, o que
          a evidência aguenta, quem é afetado, e o que a manchete deixou de
          fora. Clareza, rigor, interpretação.
        </p>
        <p>
          O Blog é a referência factual. O Medium é onde a notícia vira
          pergunta. A newsletter é a conversa com quem já acompanha — o que, de
          tudo, merece atenção agora. A opinião assinada é outra categoria: ali
          o “eu” entra, a evidência continua mandando.
        </p>
        <p>
          Isto não substitui consulta médica. Também não substitui ler o paper
          ou a RDC. A gente traduz os dois — e aponta a incoerência quando ela
          está no documento, não no slogan.
        </p>
        <p>
          <Link href="/">Voltar à capa</Link>
        </p>
      </div>
    </div>
  );
}
