import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
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

export function Markdown({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/);
  const nodes: ReactNode[] = [];

  for (const [i, block] of blocks.entries()) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      nodes.push(<h2 key={i}>{inline(trimmed.slice(3))}</h2>);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      nodes.push(<h2 key={i}>{inline(trimmed.slice(2))}</h2>);
      continue;
    }
    if (trimmed.split("\n").every((line) => line.trim().startsWith("- "))) {
      nodes.push(
        <ul key={i}>
          {trimmed.split("\n").map((line, j) => (
            <li key={j}>{inline(line.replace(/^- /, ""))}</li>
          ))}
        </ul>,
      );
      continue;
    }
    nodes.push(<p key={i}>{inline(trimmed.replace(/\n/g, " "))}</p>);
  }

  return <div className="prose-editorial">{nodes}</div>;
}
