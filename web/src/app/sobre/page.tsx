import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre o portal",
  description:
    "Método editorial do Tudo Sobre Cannabis: fontes allowlist, voz humana, SEO e gate clínico.",
};

export default function SobrePage() {
  return (
    <div className="page-intro" style={{ maxWidth: "42rem" }}>
      <p className="kicker">Expediente</p>
      <h1>Um portal, não uma loja.</h1>
      <div className="prose-editorial">
        <p>
          Tudo Sobre Cannabis existe para ocupar o espaço que o Brasil ainda não
          tem: um veículo de cannabis medicinal que o familiar consegue ler e o
          prescritor não precisa desmentir.
        </p>
        <p>
          Cada texto passa por uma esteira. Pesquisa só em fontes
          pré-determinadas. Redação na voz do portal. Humanização contra o
          português de modelo. Edição de SEO e de citação em buscas de IA.
          Publicação só com gate humano — porque isto é saúde.
        </p>
        <p>
          Não prescrevemos. Não ensinamos cultivo. Não vendemos óleo no primeiro
          parágrafo. O funil, quando existir, será o de quem já entendeu o
          caminho legal e procura um próximo passo honesto.
        </p>
        <p>
          Norte: ser o maior portal de conteúdo do tema no país. O atalho de
          páginas vazias não está no mapa.
        </p>
      </div>
    </div>
  );
}
