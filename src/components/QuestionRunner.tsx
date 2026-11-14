"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "./fetcher";
import { Badge, buttonClass, cx } from "./ui";
import { BLOOM_LABEL, TYPE_LABEL, type Bloom, type QuestionType } from "@/lib/questions";

interface Feedback {
  isCorrect: boolean | null;
  credit: number;
  marksAwarded: number;
  answer: Record<string, unknown>;
  explanation: string;
  misconception: string;
  solutionSteps: string[];
  hints: string[];
  keyPoints?: string[];
  aiFeedback?: string | null;
}
interface Item {
  id: string;
  order: number;
  type: QuestionType;
  bloom: Bloom;
  marks: number;
  outcomeCode: string;
  stem: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown> | null;
  answered: boolean;
  hintsUsed: number;
  hintsShown: string[];
  feedback: Feedback | null;
}
export interface AttemptData {
  id: string;
  title: string;
  mode: "PRACTICE" | "TEST";
  status: "IN_PROGRESS" | "SUBMITTED";
  score: number;
  maxScore: number;
  startedAt: string;
  timeLimitMin: number | null;
  items: Item[];
}

type Resp = Record<string, unknown>;

function hasResponse(type: QuestionType, r: Resp | undefined) {
  if (!r) return false;
  switch (type) {
    case "MCQ": case "ASSERTION_REASON": return typeof r.index === "number";
    case "TRUE_FALSE": return typeof r.value === "boolean";
    case "FILL_BLANK": return Array.isArray(r.blanks) && (r.blanks as string[]).every((b) => b?.trim());
    case "MATCHING": return Array.isArray(r.pairs) && (r.pairs as number[]).every((p) => p >= 0);
    case "NUMERICAL": return String(r.value ?? "").trim() !== "";
    case "CONCEPTUAL": return String(r.text ?? "").trim().length >= 10;
  }
}

/** Human-readable correct answer for feedback. */
function correctAnswerText(it: Item): string {
  const a = it.feedback?.answer ?? {};
  const p = it.payload as { options?: string[]; left?: string[]; right?: string[]; unit?: string };
  switch (it.type) {
    case "MCQ": case "ASSERTION_REASON": return `${String.fromCharCode(65 + (a.index as number))}. ${p.options?.[a.index as number] ?? ""}`;
    case "TRUE_FALSE": return a.value ? "True" : "False";
    case "FILL_BLANK": return (a.blanks as string[][]).map((b, i) => `(${i + 1}) ${b.join(" / ")}`).join("   ");
    case "MATCHING": return (p.left ?? []).map((l, i) => `${l} → ${p.right?.[(a.pairs as number[])[i]]}`).join("; ");
    case "NUMERICAL": return `${a.value} ${p.unit ?? ""}`.trim();
    case "CONCEPTUAL": return String(a.modelAnswer ?? "");
  }
}

function ItemInput({ it, value, onChange, locked }: { it: Item; value: Resp | undefined; onChange: (r: Resp) => void; locked: boolean }) {
  const p = it.payload as { options?: string[]; left?: string[]; right?: string[]; unit?: string; assertion?: string; reason?: string };
  const choice = (opts: string[], selected: number | undefined) => (
    <div className="space-y-2" role="radiogroup">
      {opts.map((o, i) => (
        <label key={i} className={cx("flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors", selected === i ? "border-brand bg-brand-soft" : "border-line hover:border-ink-muted", locked && "cursor-default")}>
          <input type="radio" className="mt-0.5 accent-[rgb(var(--brand))]" checked={selected === i} disabled={locked} onChange={() => onChange({ index: i })} />
          <span><span className="mr-1 font-semibold">{String.fromCharCode(65 + i)}.</span>{o}</span>
        </label>
      ))}
    </div>
  );
  switch (it.type) {
    case "MCQ":
      return choice(p.options ?? [], value?.index as number | undefined);
    case "ASSERTION_REASON":
      return (
        <div className="space-y-3">
          <div className="rounded-xl bg-page p-3 text-sm"><p><span className="font-semibold">Assertion (A):</span> {p.assertion}</p><p className="mt-2"><span className="font-semibold">Reason (R):</span> {p.reason}</p></div>
          {choice(p.options ?? [], value?.index as number | undefined)}
        </div>
      );
    case "TRUE_FALSE":
      return (
        <div className="flex gap-3">
          {[true, false].map((v) => (
            <button key={String(v)} disabled={locked} onClick={() => onChange({ value: v })} className={cx("flex-1 rounded-xl border p-3 text-sm font-medium", value?.value === v ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-ink-muted")}>
              {v ? "True" : "False"}
            </button>
          ))}
        </div>
      );
    case "FILL_BLANK": {
      const parts = it.stem.split(/_{3,}/);
      const blanks = (value?.blanks as string[]) ?? Array(parts.length - 1).fill("");
      return (
        <p className="text-base leading-9">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <input aria-label={`Blank ${i + 1}`} disabled={locked} value={blanks[i] ?? ""} onChange={(e) => { const b = [...blanks]; b[i] = e.target.value; onChange({ blanks: b }); }}
                  className="mx-1 w-40 rounded-lg border border-line bg-surface px-2 py-1 text-sm" />
              )}
            </span>
          ))}
        </p>
      );
    }
    case "MATCHING": {
      const pairs = (value?.pairs as number[]) ?? Array(p.left?.length ?? 0).fill(-1);
      return (
        <div className="space-y-2">
          {(p.left ?? []).map((l, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-line p-3 text-sm sm:grid-cols-2 sm:items-center">
              <span className="font-medium">{l}</span>
              <select disabled={locked} value={pairs[i]} onChange={(e) => { const n = [...pairs]; n[i] = Number(e.target.value); onChange({ pairs: n }); }} className="rounded-lg border border-line bg-surface px-2 py-1.5">
                <option value={-1}>Choose a match…</option>
                {(p.right ?? []).map((r, j) => <option key={j} value={j}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      );
    }
    case "NUMERICAL":
      return (
        <div className="flex items-center gap-2">
          <input inputMode="decimal" disabled={locked} placeholder="Your answer, e.g. 9.8 or 1.2e-6" value={String(value?.value ?? "")} onChange={(e) => onChange({ value: e.target.value })}
            className="w-64 rounded-xl border border-line bg-surface px-3 py-2.5 tabular" />
          {p.unit && <span className="text-sm text-ink-soft">{p.unit}</span>}
        </div>
      );
    case "CONCEPTUAL":
      return (
        <textarea disabled={locked} rows={6} placeholder="Explain in your own words (3-6 sentences)…" value={String(value?.text ?? "")} onChange={(e) => onChange({ text: e.target.value })}
          className="w-full rounded-xl border border-line bg-surface p-3 text-sm" />
      );
  }
}

function FeedbackPanel({ it }: { it: Item }) {
  const f = it.feedback!;
  const full = f.isCorrect;
  const partial = !full && f.credit > 0;
  const tutorQ = encodeURIComponent(`I'm working on this question (${it.outcomeCode}): "${it.stem}". The correct answer is ${correctAnswerText(it)}. Can you help me understand why?`);
  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-line bg-page p-4 text-sm">
      <p className={cx("flex items-center gap-2 font-semibold", full ? "text-good" : partial ? "text-warn" : "text-bad")}>
        <span aria-hidden className="text-lg">{full ? "✓" : partial ? "◐" : "✗"}</span>
        {full ? "Correct" : partial ? `Partly correct (${Math.round(f.credit * 100)}%)` : "Not quite"}
        <span className="tabular font-normal text-ink-muted">· {f.marksAwarded}/{it.marks} mark{it.marks > 1 ? "s" : ""}{it.hintsUsed ? ` after ${it.hintsUsed} hint${it.hintsUsed > 1 ? "s" : ""}` : ""}</span>
      </p>
      {f.aiFeedback && <p className="rounded-xl bg-raised p-3 text-ink-soft">{f.aiFeedback}</p>}
      <div><p className="font-semibold text-ink">Correct answer</p><p className="mt-1 whitespace-pre-line text-ink-soft">{correctAnswerText(it)}</p></div>
      {f.keyPoints && f.keyPoints.length > 0 && (
        <div><p className="font-semibold text-ink">Marking points</p><ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-soft">{f.keyPoints.map((k) => <li key={k}>{k}</li>)}</ul></div>
      )}
      {f.solutionSteps.length > 0 && (
        <div><p className="font-semibold text-ink">Step-by-step solution</p><ol className="mt-1 list-decimal space-y-0.5 pl-5 text-ink-soft">{f.solutionSteps.map((s, i) => <li key={i} className="tabular">{s}</li>)}</ol></div>
      )}
      <div><p className="font-semibold text-ink">Explanation</p><p className="mt-1 text-ink-soft">{f.explanation}</p></div>
      <div className="rounded-xl border border-warn/30 bg-warn/5 p-3"><p className="font-semibold text-ink">Common misconception</p><p className="mt-1 text-ink-soft">{f.misconception}</p></div>
      <details><summary className="cursor-pointer text-ink-soft">Show all three hints</summary><ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft">{f.hints.map((h, i) => <li key={i}>{h}</li>)}</ol></details>
      <Link href={`/tutor?q=${tutorQ}`} className="inline-flex text-brand hover:underline">Ask the AI tutor about this question →</Link>
    </div>
  );
}

export function QuestionRunner({ initial }: { initial: AttemptData }) {
  const [data, setData] = useState(initial);
  const [idx, setIdx] = useState(() => Math.max(0, initial.items.findIndex((i) => !i.answered)));
  const [drafts, setDrafts] = useState<Record<string, Resp>>(() => Object.fromEntries(initial.items.filter((i) => i.response).map((i) => [i.id, i.response as Resp])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const submitted = data.status === "SUBMITTED";
  const practice = data.mode === "PRACTICE";
  const it = data.items[idx];
  const deadline = data.timeLimitMin ? new Date(data.startedAt).getTime() + data.timeLimitMin * 60_000 : null;

  useEffect(() => {
    if (!deadline || submitted) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline, submitted]);
  const remaining = deadline ? Math.max(0, deadline - now) : null;

  const answeredCount = useMemo(() => data.items.filter((i) => i.answered).length, [data]);

  async function refresh() {
    setData(await api<AttemptData>(`/api/attempts/${data.id}`));
  }
  async function act<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  const submitAll = () => act(async () => setData(await api<AttemptData>(`/api/attempts/${data.id}/submit`, { json: {} })));

  useEffect(() => {
    if (remaining === 0 && !submitted && !busy) void submitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining === 0]);

  if (data.items.length === 0) return <p>This attempt has no questions.</p>;

  const pct = data.maxScore ? Math.round((data.score / data.maxScore) * 100) : 0;
  const locked = submitted || (practice && it.answered);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_15rem]">
      <div>
        {submitted && (
          <div className="mb-5 rounded-2xl border border-line bg-raised p-5">
            <p className="text-sm text-ink-soft">Result</p>
            <p className="tabular font-display text-4xl font-semibold">{pct}%</p>
            <p className="tabular text-sm text-ink-muted">{Math.round(data.score * 10) / 10} of {data.maxScore} marks · {answeredCount} of {data.items.length} answered</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/analytics" className={buttonClass("secondary", "sm")}>See my progress</Link>
              <Link href="/practice" className={buttonClass("secondary", "sm")}>Practise more</Link>
            </div>
          </div>
        )}
        <article className="rounded-2xl border border-line bg-raised p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="tabular font-semibold text-ink">Question {idx + 1} of {data.items.length}</span>
            <Badge tone="brand">{TYPE_LABEL[it.type]}</Badge>
            <Badge>{BLOOM_LABEL[it.bloom]}</Badge>
            <Badge>{it.outcomeCode}</Badge>
            <span className="text-ink-muted">{it.marks} mark{it.marks > 1 ? "s" : ""}</span>
          </div>
          {it.type !== "FILL_BLANK" && <p className="mb-4 whitespace-pre-line text-base leading-relaxed text-ink">{it.stem}</p>}
          <ItemInput it={it} value={drafts[it.id]} locked={locked} onChange={(r) => setDrafts((d) => ({ ...d, [it.id]: r }))} />

          {practice && !it.answered && !submitted && (
            <div className="mt-4">
              {it.hintsShown.length > 0 && (
                <ol className="mb-3 space-y-2">
                  {it.hintsShown.map((h, i) => <li key={i} className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm"><span className="font-semibold">Hint {i + 1}:</span> {h}</li>)}
                </ol>
              )}
              {it.hintsUsed < 3 && (
                <button disabled={busy} className={buttonClass("ghost", "sm")}
                  onClick={() => act(async () => { await api(`/api/attempts/${data.id}/hint`, { json: { itemId: it.id } }); await refresh(); })}>
                  💡 Show hint {it.hintsUsed + 1} of 3 <span className="text-ink-muted">(−15%)</span>
                </button>
              )}
            </div>
          )}

          {error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            {!submitted && practice && !it.answered && (
              <button disabled={busy || !hasResponse(it.type, drafts[it.id])} className={buttonClass()}
                onClick={() => act(async () => { await api(`/api/attempts/${data.id}/answer`, { json: { itemId: it.id, response: drafts[it.id] } }); await refresh(); })}>
                {busy ? "Checking…" : "Check answer"}
              </button>
            )}
            {!submitted && !practice && (
              <button disabled={busy || !hasResponse(it.type, drafts[it.id])} className={buttonClass()}
                onClick={() => act(async () => {
                  await api(`/api/attempts/${data.id}/answer`, { json: { itemId: it.id, response: drafts[it.id] } });
                  await refresh();
                  if (idx < data.items.length - 1) setIdx(idx + 1);
                })}>
                {it.answered ? "Update answer" : "Save answer"}{idx < data.items.length - 1 ? " & next" : ""}
              </button>
            )}
            {idx > 0 && <button className={buttonClass("secondary")} onClick={() => setIdx(idx - 1)}>Previous</button>}
            {idx < data.items.length - 1 && <button className={buttonClass("secondary")} onClick={() => setIdx(idx + 1)}>Next</button>}
          </div>

          {it.feedback && <FeedbackPanel it={it} />}
        </article>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-raised p-4">
          <p className="font-medium">{data.title}</p>
          <p className="text-xs text-ink-muted">{practice ? "Practice · instant feedback & hints" : "Test · feedback after submitting"}</p>
          {remaining !== null && !submitted && (
            <p className={cx("tabular mt-2 text-lg font-semibold", remaining < 60_000 ? "text-bad" : "text-ink")} aria-live="polite">
              ⏱ {Math.floor(remaining / 60_000)}:{String(Math.floor((remaining % 60_000) / 1000)).padStart(2, "0")}
            </p>
          )}
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {data.items.map((x, i) => {
              const tone = x.feedback ? (x.feedback.isCorrect ? "bg-good/15 text-good border-good/40" : x.feedback.credit > 0 ? "bg-warn/15 text-warn border-warn/40" : "bg-bad/10 text-bad border-bad/40") : x.answered ? "bg-brand-soft text-brand border-brand/30" : "border-line text-ink-soft";
              return (
                <button key={x.id} onClick={() => setIdx(i)} aria-label={`Question ${i + 1}${x.answered ? ", answered" : ""}`} className={cx("tabular aspect-square rounded-lg border text-xs font-medium", tone, i === idx && "ring-2 ring-brand")}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <p className="tabular mt-3 text-xs text-ink-muted">{answeredCount}/{data.items.length} answered</p>
          {!submitted && (
            <button disabled={busy} className={cx(buttonClass(practice ? "secondary" : "primary"), "mt-3 w-full")}
              onClick={() => {
                const left = data.items.length - answeredCount;
                if (left > 0 && !confirm(practice ? `Finish now? ${left} question(s) are unanswered and won't count.` : `Submit the test? ${left} unanswered question(s) will score zero.`)) return;
                void submitAll();
              }}>
              {practice ? "Finish practice" : "Submit test"}
            </button>
          )}
        </div>
        {practice && !submitted && (
          <p className="px-1 text-xs text-ink-muted">Each hint lowers the marks for that question by 15%, down to a minimum of 40%. Try first, then use hints one at a time.</p>
        )}
      </aside>
    </div>
  );
}
