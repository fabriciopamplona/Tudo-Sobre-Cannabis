import Image from "next/image";

const ACCENTS = ["clay", "lime", "forest", "ink"] as const;

export function artAccent(seed: string) {
  return ACCENTS[Array.from(seed).reduce((n, c) => n + c.charCodeAt(0), 0) % ACCENTS.length];
}

function fallbackSrc(seed: string) {
  const flowering = /cbd|canabino|flor/i.test(seed);
  return flowering ? "/brand/ilustracao-flores.webp" : "/brand/ilustracao-folhas.webp";
}

export function EditorialArt({
  seed,
  large = false,
  label = "arquivo / 2026",
  image,
  priority = false,
}: {
  seed: string;
  large?: boolean;
  label?: string;
  /** Capa do post (`image` no frontmatter). Sem capa → ilustra botânica de marca. */
  image?: string;
  priority?: boolean;
}) {
  const hasCover = Boolean(image);
  const src = image || fallbackSrc(seed);
  const accent = artAccent(seed);

  if (hasCover) {
    return (
      <div className={`art-panel cover-art ${large ? "botanical-large" : ""}`} aria-hidden="true">
        <Image
          className="cover-art-image"
          src={src}
          alt=""
          fill
          sizes="(max-width: 719px) 100vw, 50vw"
          priority={priority}
        />
        <span className="art-panel-label">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`art-panel botanical-art art-${accent} ${large ? "botanical-large" : ""}`}
      aria-hidden="true"
    >
      <span className="botanical-disc" />
      <Image
        className="botanical-image"
        src={src}
        alt=""
        fill
        sizes="(max-width: 719px) 100vw, 50vw"
        priority={priority}
      />
      <span className="botanical-index">TSC / {/flor/i.test(src) ? "02" : "01"}</span>
      <span className="art-panel-label">{label}</span>
      <span className="botanical-plus">+</span>
    </div>
  );
}
