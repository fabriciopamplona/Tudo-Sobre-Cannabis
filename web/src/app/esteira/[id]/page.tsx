import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewDesk } from "@/components/ReviewDesk";
import { getPreview } from "@/lib/board";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ editar?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const preview = await getPreview(id);
  if (!preview) return { robots: { index: false, follow: false } };
  return {
    title: `#${preview.card.id} · ${preview.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function EsteiraPreviewPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const preview = await getPreview(id);
  if (!preview) notFound();
  return <ReviewDesk preview={preview} startEditing={query.editar === "1"} />;
}
