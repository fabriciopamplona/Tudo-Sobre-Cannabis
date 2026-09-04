import type { Metadata } from "next";
import { EsteiraBoard } from "@/components/EsteiraBoard";
import { getBoard } from "@/lib/board";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Esteira editorial",
  description: "Kanban interno da esteira de publicação do Tudo Sobre Cannabis.",
  robots: { index: false, follow: false },
};

export default async function EsteiraPage() {
  const board = await getBoard();

  return (
    <div className="esteira-page">
      <div className="wrap esteira-intro">
        <p className="kicker">Redação</p>
        <h1>Esteira</h1>
        <p>
          Este é o painel. Não precisa mandar comando no chat para acompanhar.
          Cada pauta tem um número estável. O botão do cartão é o que avança o status
          (fila → esteira → gate → assinar → publicar). No terminal:{" "}
          <code>npm run agent -- --id 12</code>. No chat: <code>trabalha o #12</code>.
        </p>
      </div>
      <EsteiraBoard board={board} />
    </div>
  );
}
