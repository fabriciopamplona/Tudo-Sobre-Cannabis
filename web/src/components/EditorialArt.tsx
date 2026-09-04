const ACCENTS = ["clay", "lime", "forest", "ink"] as const;

export function artAccent(seed: string) {
  let n = 0;
  for (const char of seed) n += char.charCodeAt(0);
  return ACCENTS[n % ACCENTS.length];
}

export function EditorialArt({
  seed,
  large = false,
  label = "arquivo / 2026",
}: {
  seed: string;
  large?: boolean;
  label?: string;
}) {
  const accent = artAccent(seed);
  return (
    <div className={`art-panel art-${accent}`} aria-hidden="true">
      <span className="art-ring" style={{ right: "-3rem", top: "-3rem", width: "11rem", height: "11rem" }} />
      <span className="art-ring" style={{ right: "-1rem", top: 0, width: "14rem", height: "14rem" }} />
      <span className="art-blob" style={{ bottom: "-3.5rem", left: "-2.5rem", width: "10rem", height: "10rem" }} />
      <span
        className="art-leaf"
        style={{
          right: "17%",
          top: large ? "25%" : "23%",
          width: large ? "8rem" : "5rem",
          height: large ? "11rem" : "6rem",
        }}
      />
      <span className="art-panel-label">{label}</span>
      <span className="art-panel-letter">T</span>
    </div>
  );
}
