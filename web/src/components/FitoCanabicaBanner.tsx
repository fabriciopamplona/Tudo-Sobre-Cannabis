import Image from "next/image";
import { LINKS } from "@/lib/authors";

type Variant = "sidebar" | "inline";

const ASSETS: Record<
  Variant,
  { src: string; width: number; height: number; sizes: string }
> = {
  sidebar: {
    src: "/partners/fitocanabica-consulta.webp",
    width: 1024,
    height: 1024,
    sizes: "(max-width: 767px) 100vw, 240px",
  },
  inline: {
    src: "/partners/fitocanabica-consulta-horizontal.webp",
    width: 1536,
    height: 1024,
    sizes: "(max-width: 767px) 100vw, 688px",
  },
};

/**
 * Banner Fito Canábica — parceiro comercial (não é conteúdo editorial).
 * Clique na arte → WhatsApp; legenda → site.
 * Layout do Blog: lateral + meio do post em toda peça publicada.
 */
export function FitoCanabicaBanner({ variant = "sidebar" }: { variant?: Variant }) {
  const asset = ASSETS[variant];
  const isInline = variant === "inline";

  return (
    <div
      className={isInline ? "partner-banner partner-banner-inline" : "partner-banner"}
      aria-label="Parceiro comercial"
    >
      <p className="article-mono partner-banner-label">Parceiro Comercial</p>
      <a
        className="partner-banner-link"
        href={LINKS.fitoCanabicaWhatsApp}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        <Image
          className="partner-banner-image"
          src={asset.src}
          alt="Fito Canábica: agende consulta com médico prescritor de cannabis medicinal pelo WhatsApp"
          width={asset.width}
          height={asset.height}
          sizes={asset.sizes}
          unoptimized
        />
      </a>
      <p className="partner-banner-note">
        Intermediação de consultas com prescritores ·{" "}
        <a href={LINKS.fitoCanabica} target="_blank" rel="noopener noreferrer sponsored">
          fitocanabica.com.br
        </a>
      </p>
    </div>
  );
}
