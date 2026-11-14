"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "./fetcher";
import { Badge, StateChip, buttonClass, cx } from "./ui";
import { QUESTION_TYPES, TYPE_LABEL, type QuestionType } from "@/lib/questions";
import type { MasteryState } from "@/lib/mastery";

export interface PickerTheme {
  code: string;
  name: string;
  weighting: number;
  topics: { code: string; name: string; weighting: number; subtopics: { number: string; title: string }[]; outcomes: { code: string; roman: string; statement: string; approvedQuestions: number; state: MasteryState; score: number }[] }[];
}

export function PracticePicker({ themes, initialOutcome }: { themes: PickerTheme[]; initialOutcome?: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialOutcome ? [initialOutcome] : []));
  const [open, setOpen] = useState<Set<string>>(new Set(initialOutcome ? [initialOutcome.split(".")[1]] : [themes[0]?.code]));
  const [count, setCount] = useState(10);
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = useMemo(() => themes.flatMap((t) => t.topics.flatMap((tp) => tp.outcomes)).filter((o) => selected.has(o.code)).reduce((s, o) => s + o.approvedQuestions, 0), [themes, selected]);

  const toggle = (codes: string[]) =>
    setSelected((s) => {
      const n = new Set(s);
      const all = codes.every((c) => n.has(c));
      codes.forEach((c) => (all ? n.delete(c) : n.add(c)));
      return n;
    });

  async function start(body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const a = await api<{ id: string }>("/api/attempts", { json: body });
      router.push(`/quiz/${a.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start practice");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-3">
        {themes.map((t) => {
          const codes = t.topics.flatMap((tp) => tp.outcomes.map((o) => o.code));
          const isOpen = open.has(t.code);
          return (
            <section key={t.code} className="rounded-2xl border border-line bg-raised">
              <div className="flex items-center gap-3 p-4">
                <input type="checkbox" aria-label={`Select all of ${t.name}`} className="h-4 w-4 accent-[rgb(var(--brand))]" checked={codes.every((c) => selected.has(c))} onChange={() => toggle(codes)} />
                <button className="flex flex-1 items-center justify-between text-left" aria-expanded={isOpen} onClick={() => setOpen((o) => { const n = new Set(o); if (n.has(t.code)) n.delete(t.code); else n.add(t.code); return n; })}>
                  <span>
                    <span className="font-display text-lg font-semibold">{t.name}</span>
                    <span className="ml-2 text-xs text-ink-muted">{t.weighting}% of Class XII · {codes.length} outcomes</span>
                  </span>
                  <span aria-hidden className="text-ink-muted">{isOpen ? "−" : "+"}</span>
                </button>
              </div>
              {isOpen && (
                <div className="space-y-4 border-t border-line p-4">
                  {t.topics.map((tp) => (
                    <div key={tp.code}>
                      <label className="flex items-center gap-2 font-medium">
                        <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={tp.outcomes.every((o) => selected.has(o.code))} onChange={() => toggle(tp.outcomes.map((o) => o.code))} />
                        {tp.name} <span className="text-xs font-normal text-ink-muted">({tp.weighting}%)</span>
                      </label>
                      <p className="ml-6 text-xs text-ink-muted">{tp.subtopics.map((s) => `${s.number} ${s.title}`).join(" · ")}</p>
                      <ul className="ml-6 mt-2 space-y-1.5">
                        {tp.outcomes.map((o) => (
                          <li key={o.code}>
                            <label className={cx("flex cursor-pointer items-start gap-2 rounded-xl p-2 text-sm hover:bg-page", selected.has(o.code) && "bg-brand-soft/60")}>
                              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--brand))]" checked={selected.has(o.code)} onChange={() => toggle([o.code])} />
                              <span className="flex-1">
                                <span className="font-mono text-xs text-ink-muted">{o.code}</span> {o.statement}
                                <span className="mt-1 flex flex-wrap items-center gap-2">
                                  <StateChip state={o.state} />
                                  {o.state !== "not_started" && <span className="tabular text-xs text-ink-muted">{o.score}%</span>}
                                  <span className="text-xs text-ink-muted">{o.approvedQuestions} question{o.approvedQuestions === 1 ? "" : "s"}</span>
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-line bg-raised p-4">
          <p className="font-medium">Your practice set</p>
          <p className="tabular mt-1 text-sm text-ink-soft">{selected.size} outcome{selected.size === 1 ? "" : "s"} · {available} questions available</p>
          <label className="mt-4 block text-sm">
            Number of questions
            <input type="number" min={1} max={30} value={count} onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value))))} className="tabular mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2" />
          </label>
          <fieldset className="mt-4">
            <legend className="text-sm">Question types <span className="text-ink-muted">(all if none ticked)</span></legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUESTION_TYPES.map((t) => (
                <button key={t} type="button" aria-pressed={types.includes(t)} onClick={() => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
                  className={cx("rounded-full border px-2.5 py-1 text-xs", types.includes(t) ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-soft")}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}
          <button disabled={busy || selected.size === 0} className={cx(buttonClass(), "mt-4 w-full")} onClick={() => start({ kind: "practice", outcomes: [...selected], count, types: types.length ? types : undefined })}>
            {busy ? "Starting…" : "Start practice"}
          </button>
        </div>
        <div className="rounded-2xl border border-line bg-raised p-4">
          <p className="font-medium">Not sure where to start?</p>
          <p className="mt-1 text-sm text-ink-soft">Smart review picks questions from your four weakest learning outcomes.</p>
          <button disabled={busy} className={cx(buttonClass("secondary"), "mt-3 w-full")} onClick={() => start({ kind: "review", count: 10 })}>Start smart review</button>
        </div>
        <p className="px-1 text-xs text-ink-muted"><Badge>Practice mode</Badge> gives instant feedback, three graduated hints and worked solutions for every question.</p>
      </aside>
    </div>
  );
}
