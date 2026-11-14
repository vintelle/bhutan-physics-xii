"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../fetcher";
import { buttonClass, cx } from "../ui";
import { BLOOM_LABEL, QUESTION_TYPES, QUIZ_BLOOMS, TYPE_LABEL, type QuestionType } from "@/lib/questions";
import { DEFAULT_BLOOM_MIX } from "@/lib/blueprint";

interface ThemeOpt { code: string; name: string; topics: { code: string; name: string; weighting: number; approved: number }[] }
interface Plan { questionIds: string[]; perTopic: Record<string, { target: number; picked: number }>; perBloom: Record<string, { target: number; picked: number }>; shortfall: string[] }
const inp = "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export function QuizBuilder({ themes, classes }: { themes: ThemeOpt[]; classes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [topics, setTopics] = useState<Set<string>>(new Set(themes.find((t) => t.code === "EM")?.topics.map((t) => t.code) ?? []));
  const [form, setForm] = useState({ title: "Unit test", mode: "TEST", timeLimitMin: 40, classId: classes[0]?.id ?? "", questionCount: 15, published: false });
  const [mix, setMix] = useState<Record<string, number>>({ ...DEFAULT_BLOOM_MIX });
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const topicName = new Map(themes.flatMap((t) => t.topics.map((tp) => [tp.code, tp.name] as const)));
  const body = (preview: boolean) => ({ ...form, classId: form.classId || undefined, timeLimitMin: form.mode === "TEST" ? form.timeLimitMin : undefined, topics: [...topics], bloomMix: mix, types: types.length ? types : undefined, preview });

  async function run(preview: boolean) {
    setBusy(true); setErr(null);
    try {
      const r = await api<{ plan: Plan; quiz?: { id: string } }>("/api/quizzes/generate", { json: body(preview) });
      setPlan(r.plan);
      if (!preview) { router.refresh(); setPlan(null); alert(`Created "${form.title}" with ${r.plan.questionIds.length} questions.${form.published ? " It is published to the class." : " It is unpublished - publish it from the list when ready."}`); }
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not build the test"); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">Title<input className={inp} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="text-sm">Mode<select className={inp} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option value="TEST">Test - feedback after submitting</option><option value="PRACTICE">Practice - instant feedback & hints</option></select></label>
          {form.mode === "TEST" && <label className="text-sm">Time limit (minutes)<input type="number" min={5} max={240} className={inp} value={form.timeLimitMin} onChange={(e) => setForm({ ...form, timeLimitMin: Number(e.target.value) })} /></label>}
          <label className="text-sm">Assign to class<select className={inp} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}><option value="">All my students (no class)</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="text-sm">Number of questions<input type="number" min={3} max={60} className={inp} value={form.questionCount} onChange={(e) => setForm({ ...form, questionCount: Number(e.target.value) })} /></label>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Topics <span className="font-normal text-ink-muted">- questions are shared out by the IG Annexure 2 weighting</span></legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {themes.map((t) => (
              <div key={t.code} className="rounded-xl border border-line p-3">
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={t.topics.every((tp) => topics.has(tp.code))} onChange={(e) => setTopics((s) => { const n = new Set(s); t.topics.forEach((tp) => (e.target.checked ? n.add(tp.code) : n.delete(tp.code))); return n; })} />{t.name}</label>
                <ul className="ml-6 mt-1 space-y-1">
                  {t.topics.map((tp) => (
                    <li key={tp.code}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={topics.has(tp.code)} onChange={() => setTopics((s) => { const n = new Set(s); if (n.has(tp.code)) n.delete(tp.code); else n.add(tp.code); return n; })} />{tp.name}<span className="tabular text-xs text-ink-muted">{tp.weighting}% · {tp.approved} items</span></label></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Bloom's taxonomy mix <span className="font-normal text-ink-muted">(relative weights)</span></legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-5">
            {QUIZ_BLOOMS.map((b) => <label key={b} className="text-xs">{BLOOM_LABEL[b]}<input type="number" min={0} max={100} className={inp} value={mix[b]} onChange={(e) => setMix({ ...mix, [b]: Number(e.target.value) })} /></label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Question types <span className="font-normal text-ink-muted">(all if none selected)</span></legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUESTION_TYPES.map((t) => <button key={t} type="button" aria-pressed={types.includes(t)} onClick={() => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} className={cx("rounded-full border px-2.5 py-1 text-xs", types.includes(t) ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-soft")}>{TYPE_LABEL[t]}</button>)}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Publish to students straight away</label>
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <div className="flex flex-wrap gap-2">
          <button disabled={busy || topics.size === 0} className={buttonClass("secondary")} onClick={() => run(true)}>Preview blueprint</button>
          <button disabled={busy || topics.size === 0} className={buttonClass()} onClick={() => run(false)}>{busy ? "Building…" : "Generate test"}</button>
        </div>
      </div>
      <aside className="rounded-2xl border border-line bg-raised p-4 text-sm lg:sticky lg:top-20 lg:self-start">
        <p className="font-medium">Blueprint</p>
        {!plan ? <p className="mt-1 text-ink-soft">Preview to see how the questions are distributed across topics and Bloom levels before you create the test. Questions are ordered from lower to higher demand.</p> : (
          <>
            <table className="mt-2 w-full"><thead className="text-left text-xs text-ink-muted"><tr><th className="font-medium">Topic</th><th className="text-right font-medium">Target</th><th className="text-right font-medium">Picked</th></tr></thead>
              <tbody>{Object.entries(plan.perTopic).map(([k, v]) => <tr key={k} className="border-t border-line"><td className="py-1">{topicName.get(k)}</td><td className="tabular text-right">{v.target}</td><td className={cx("tabular text-right", v.picked < v.target && "text-bad")}>{v.picked}</td></tr>)}</tbody></table>
            <table className="mt-3 w-full"><thead className="text-left text-xs text-ink-muted"><tr><th className="font-medium">Bloom level</th><th className="text-right font-medium">Target</th><th className="text-right font-medium">Picked</th></tr></thead>
              <tbody>{Object.entries(plan.perBloom).map(([k, v]) => <tr key={k} className="border-t border-line"><td className="py-1">{BLOOM_LABEL[k as "APPLYING"]}</td><td className="tabular text-right">{v.target}</td><td className="tabular text-right">{v.picked}</td></tr>)}</tbody></table>
            {plan.shortfall.length > 0 && <ul className="mt-3 space-y-1 text-xs text-bad">{plan.shortfall.map((s) => <li key={s}>⚠ {s.replace(/^[A-Z]+\.\d+/, (c) => topicName.get(c) ?? c)} - add or approve more questions for this topic.</li>)}</ul>}
          </>
        )}
      </aside>
    </div>
  );
}
