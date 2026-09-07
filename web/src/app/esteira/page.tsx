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
  const gate =
    (board.counts.gate || 0) + (board.counts.approved || 0);

  return (
    <div className="esteira-page">
      <div className="wrap esteira-intro">
        <p className="kicker">Redação</p>
        <h1>Esteira</h1>
        <p>
          Inbox → Fila → Esteira (IA) → Gate (OK humano) → No ar.
          Agora: <strong>{gate} no Gate</strong>, {board.counts.published || 0} no ar,{" "}
          {board.counts.queued || 0} na fila.
        </p>
      </div>
      <EsteiraBoard board={board} />
    </div>
  );
}
