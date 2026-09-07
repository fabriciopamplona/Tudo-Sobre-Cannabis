import { Fragment, type ReactNode } from "react";
import { headingId } from "./site";

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // LACUNA antes de links: o marcador usa colchetes sem (url) e precisa saltar na tela.
  const pattern =
    /(\[LACUNA(?::[^\]]*)?\]|\*\*[^*]+\*\*|\*[^*]+\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("[LACUNA")) {
      parts.push(
        <mark key={key++} className="editorial-lacuna">
          {token}
        </mark>,
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(
        <a key={key++} href={match[3]}>
          {match[2]}
        </a>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function isBlockquote(trimmed: string) {
  const lines = trimmed.split("\n");
  return lines.length > 0 && lines.every((line) => /^>\s?/.test(line.trim()) || line.trim() === "");
}

function parseBlockquote(trimmed: string): ReactNode {
  const text = trimmed
    .split("\n")
    .map((line) => line.trim().replace(/^>\s?/, ""))
    .filter((line) => line.length > 0)
    .join(" ");
  return <blockquote>{inline(text)}</blockquote>;
}

function isFigureBlock(trimmed: string) {
  const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 1 || lines.length > 3) return false;
  const imageLine = lines.find((line) => /^!\[/.test(line));
  if (!imageLine) return false;
  const others = lines.filter((line) => line !== imageLine);
  return others.every(
    (line) =>
      /^(Figura|Ilustração|Caption)\s*:/i.test(line) ||
      (/^\*.+\*$/.test(line) && !/^\*\*/.test(line)),
  );
}

function parseFigure(trimmed: string): ReactNode {
  const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  const imageLine = lines.find((line) => /^!\[/.test(line)) || "";
  const match = imageLine.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
  if (!match) return null;
  const [, alt, src, title] = match;
  let caption: string | null = null;
  for (const line of lines) {
    if (line === imageLine) continue;
    if (/^(Figura|Ilustração|Caption)\s*:/i.test(line)) {
      caption = line.replace(/^(Figura|Ilustração|Caption)\s*:\s*/i, "").trim();
    } else if (/^\*.+\*$/.test(line)) {
      caption = line.slice(1, -1).trim();
    }
  }
  return (
    <figure className="editorial-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        title={title || undefined}
        width={1536}
        height={1024}
        loading="lazy"
        decoding="async"
      />
      {caption ? (
        <figcaption>
          <span className="editorial-figure-credit">Ilustração editorial</span>
          {caption}
        </figcaption>
      ) : (
        <figcaption>
          <span className="editorial-figure-credit">Ilustração editorial</span>
        </figcaption>
      )}
    </figure>
  );
}

function isSeparatorRow(line: string) {
  const cells = line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isTableBlock(trimmed: string) {
  const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const pipeLines = lines.filter((line) => line.includes("|"));
  if (pipeLines.length < 2) return false;
  const captionOnly = lines.filter((line) => !line.includes("|"));
  if (captionOnly.length > 1) return false;
  if (captionOnly.length === 1 && !/^(Tabela|Table)\s*:/i.test(captionOnly[0])) return false;
  return pipeLines.some(isSeparatorRow);
}

function parseTable(trimmed: string): ReactNode {
  const rawLines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  let caption: string | null = null;
  let lines = rawLines;
  if (rawLines[0] && !rawLines[0].includes("|") && /^(Tabela|Table)\s*:/i.test(rawLines[0])) {
    caption = rawLines[0].replace(/^(Tabela|Table)\s*:\s*/i, "").trim();
    lines = rawLines.slice(1);
  }
  lines = lines.filter((line) => !isSeparatorRow(line));
  if (lines.length < 1) return null;
  const rows = lines.map((line) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim()),
  );
  const [header, ...body] = rows;
  const colCount = Math.max(...rows.map((row) => row.length));
  const labels = Array.from({ length: colCount }, (_, i) => header[i] || `Coluna ${i + 1}`);
  const regionLabel = caption || "Tabela comparativa";

  return (
    <figure className="editorial-table">
      {caption ? <figcaption>{inline(caption)}</figcaption> : null}
      <div className="editorial-table-scroll" role="region" aria-label={regionLabel} tabIndex={0}>
        <table>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {labels.map((cell, i) => (
                <th key={i} scope="col">
                  {inline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i}>
                {labels.map((label, j) => {
                  const cell = row[j] || "";
                  if (j === 0) {
                    return (
                      <th key={j} scope="row" data-label={label}>
                        {inline(cell)}
                      </th>
                    );
                  }
                  return (
                    <td key={j} data-label={label}>
                      {inline(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function Markdown({
  source,
  className = "prose-editorial",
  annotate = false,
}: {
  source: string;
  className?: string;
  annotate?: boolean;
}) {
  const blocks = source.split(/\n{2,}/);
  const nodes: ReactNode[] = [];
  let ledeOpen = true;

  for (const [i, block] of blocks.entries()) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    let inner: ReactNode;
    if (trimmed.startsWith("### ")) {
      const label = trimmed.slice(4);
      ledeOpen = false;
      inner = <h3 id={headingId(label)}>{inline(label)}</h3>;
    } else if (trimmed.startsWith("## ")) {
      const label = trimmed.slice(3);
      ledeOpen = false;
      inner = <h2 id={headingId(label)}>{inline(label)}</h2>;
    } else if (trimmed.startsWith("# ")) {
      const label = trimmed.slice(2);
      ledeOpen = false;
      inner = <h2 id={headingId(label)}>{inline(label)}</h2>;
    } else if (isBlockquote(trimmed)) {
      ledeOpen = false;
      inner = parseBlockquote(trimmed);
    } else if (isFigureBlock(trimmed)) {
      ledeOpen = false;
      inner = parseFigure(trimmed);
    } else if (isTableBlock(trimmed)) {
      ledeOpen = false;
      inner = parseTable(trimmed);
    } else if (trimmed.split("\n").every((line) => line.trim().startsWith("- "))) {
      ledeOpen = false;
      inner = (
        <ul>
          {trimmed.split("\n").map((line, j) => (
            <li key={j}>{inline(line.replace(/^- /, ""))}</li>
          ))}
        </ul>
      );
    } else if (trimmed.split("\n").every((line) => /^\d+\.\s/.test(line.trim()))) {
      ledeOpen = false;
      inner = (
        <ol>
          {trimmed.split("\n").map((line, j) => (
            <li key={j}>{inline(line.replace(/^\d+\.\s/, ""))}</li>
          ))}
        </ol>
      );
    } else {
      inner = <p className={ledeOpen ? "lede" : undefined}>{inline(trimmed.replace(/\n/g, " "))}</p>;
      ledeOpen = false;
    }

    if (annotate) {
      nodes.push(
        <div key={i} data-block={i} className="review-block">
          {inner}
        </div>,
      );
    } else {
      nodes.push(<Fragment key={i}>{inner}</Fragment>);
    }
  }

  return <div className={className}>{nodes}</div>;
}
