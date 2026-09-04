import { Fragment, type ReactNode } from "react";
import { headingId } from "./site";

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
    if (trimmed.startsWith("## ")) {
      const label = trimmed.slice(3);
      ledeOpen = false;
      inner = (
        <h2 id={headingId(label)}>
          {inline(label)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      const label = trimmed.slice(2);
      ledeOpen = false;
      inner = (
        <h2 id={headingId(label)}>
          {inline(label)}
        </h2>
      );
    } else if (trimmed.split("\n").every((line) => line.trim().startsWith("- "))) {
      ledeOpen = false;
      inner = (
        <ul>
          {trimmed.split("\n").map((line, j) => (
            <li key={j}>{inline(line.replace(/^- /, ""))}</li>
          ))}
        </ul>
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
