import { Fragment, type ReactNode } from "react";

/** Minimal, safe Markdown renderer for tutor replies (no HTML injection). */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|_[^_\s][^_]*_|\*[^*\s][^*]*\*)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k} className="rounded bg-page px-1 py-0.5 text-[0.9em]">{t.slice(1, -1)}</code>);
    else out.push(<em key={k}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const L = list.ordered ? "ol" : "ul";
    blocks.push(<L key={`l${blocks.length}`} className={`${list.ordered ? "list-decimal" : "list-disc"} my-2 space-y-1 pl-5`}>{list.items.map((it, i) => <li key={i}>{inline(it, `li${blocks.length}-${i}`)}</li>)}</L>);
    list = null;
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*•]\s+(.*)/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (ul || ol) {
      const ordered = Boolean(ol);
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push((ul ?? ol)![1]);
      return;
    }
    flush();
    if (h) blocks.push(<p key={idx} className="mt-3 font-semibold">{inline(h[2], `h${idx}`)}</p>);
    else if (line.trim() === "") blocks.push(<Fragment key={idx} />);
    else blocks.push(<p key={idx} className="my-1.5">{inline(line, `p${idx}`)}</p>);
  });
  flush();
  return <div className="leading-relaxed">{blocks}</div>;
}
