"use client";
import { useState } from "react";
import { api } from "../fetcher";
import { buttonClass, cx } from "../ui";
import { ALL_BLOOMS, AR_OPTIONS, BLOOM_LABEL, DOMAIN_LABEL, QUESTION_TYPES, TYPE_LABEL, type QuestionType } from "@/lib/questions";

export interface OutcomeOption { code: string; statement: string; subtopics: string[]; topicName: string }

interface FormState {
  type: QuestionType; outcomeCode: string; subtopicNumber: string; bloom: string; domain: string; difficulty: number; marks: number;
  stem: string; explanation: string; misconception: string; hints: [string, string, string]; steps: string;
  options: string[]; correctIndex: number; tf: boolean; blanks: string; left: string[]; right: string[];
  value: string; unit: string; tolerancePct: string; assertion: string; reason: string; keyPoints: string; modelAnswer: string;
}

const empty = (outcome: OutcomeOption): FormState => ({
  type: "MCQ", outcomeCode: outcome.code, subtopicNumber: outcome.subtopics[0], bloom: "UNDERSTANDING", domain: "SK", difficulty: 2, marks: 1,
  stem: "", explanation: "", misconception: "", hints: ["", "", ""], steps: "",
  options: ["", "", "", ""], correctIndex: 0, tf: true, blanks: "", left: ["", "", "", ""], right: ["", "", "", ""],
  value: "", unit: "", tolerancePct: "2", assertion: "", reason: "", keyPoints: "", modelAnswer: "",
});

/** Turn a stored question back into form state (used when editing). */
export function fromQuestion(q: Record<string, unknown>, outcome: OutcomeOption): FormState {
  const s = empty(outcome);
  const p = (q.payload ?? {}) as Record<string, unknown>;
  const a = (q.answer ?? {}) as Record<string, unknown>;
  Object.assign(s, {
    type: q.type, outcomeCode: q.outcomeCode, subtopicNumber: q.subtopicNumber ?? outcome.subtopics[0], bloom: q.bloom, domain: q.domain, difficulty: q.difficulty, marks: q.marks,
    stem: q.stem, explanation: q.explanation, misconception: q.misconception, hints: [...(q.hints as string[])], steps: ((q.solutionSteps as string[]) ?? []).join("\n"),
  });
  if (q.type === "MCQ") { s.options = p.options as string[]; s.correctIndex = a.index as number; }
  if (q.type === "ASSERTION_REASON") { s.assertion = p.assertion as string; s.reason = p.reason as string; s.correctIndex = a.index as number; }
  if (q.type === "TRUE_FALSE") s.tf = a.value as boolean;
  if (q.type === "FILL_BLANK") s.blanks = (a.blanks as string[][]).map((b) => b.join(" | ")).join("\n");
  if (q.type === "MATCHING") { s.left = p.left as string[]; s.right = (a.pairs as number[]).map((j) => (p.right as string[])[j]); }
  if (q.type === "NUMERICAL") { s.value = String(a.value); s.unit = String(p.unit ?? ""); s.tolerancePct = String(a.tolerancePct ?? 2); }
  if (q.type === "CONCEPTUAL") { s.keyPoints = (p.keyPoints as string[]).join("\n"); s.modelAnswer = a.modelAnswer as string; }
  return s;
}

function toInput(s: FormState) {
  const lines = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);
  let payload: Record<string, unknown> = {}, answer: Record<string, unknown> = {};
  switch (s.type) {
    case "MCQ": payload = { options: s.options.filter((o) => o.trim()) }; answer = { index: s.correctIndex }; break;
    case "TRUE_FALSE": answer = { value: s.tf }; break;
    case "FILL_BLANK": answer = { blanks: lines(s.blanks).map((l) => l.split("|").map((x) => x.trim()).filter(Boolean)) }; break;
    case "MATCHING": {
      const rows = s.left.map((l, i) => [l.trim(), s.right[i]?.trim()]).filter(([l, r]) => l && r);
      const right = rows.map((r) => r[1]);
      const order = right.map((_, i) => i).sort(() => Math.random() - 0.5);
      payload = { left: rows.map((r) => r[0]), right: order.map((i) => right[i]) };
      answer = { pairs: rows.map((_, i) => order.indexOf(i)) };
      break;
    }
    case "NUMERICAL": payload = { unit: s.unit }; answer = { value: Number(s.value), tolerancePct: Number(s.tolerancePct) || 2 }; break;
    case "ASSERTION_REASON": payload = { assertion: s.assertion, reason: s.reason }; answer = { index: s.correctIndex }; break;
    case "CONCEPTUAL": payload = { keyPoints: lines(s.keyPoints) }; answer = { modelAnswer: s.modelAnswer }; break;
  }
  return {
    type: s.type, outcomeCode: s.outcomeCode, subtopicNumber: s.subtopicNumber, bloom: s.bloom, domain: s.domain, difficulty: s.difficulty, marks: s.marks,
    stem: s.type === "ASSERTION_REASON" && !s.stem.trim() ? "Read the Assertion (A) and the Reason (R), then choose the correct option." : s.stem,
    payload, answer, explanation: s.explanation, misconception: s.misconception, hints: s.hints, solutionSteps: lines(s.steps),
  };
}

const inp = "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const L = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => <label className={cx("block text-sm", className)}>{label}{children}</label>;

export function QuestionForm({ outcomes, initial, questionId, onSaved }: { outcomes: OutcomeOption[]; initial?: FormState; questionId?: string; onSaved: () => void }) {
  const [s, setS] = useState<FormState>(initial ?? empty(outcomes[0]));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const outcome = outcomes.find((o) => o.code === s.outcomeCode) ?? outcomes[0];
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((x) => ({ ...x, [k]: v }));

  async function save(status: "DRAFT" | "APPROVED") {
    setBusy(true);
    setError(null);
    try {
      const question = toInput(s);
      if (questionId) await api(`/api/questions/${questionId}`, { method: "PATCH", json: { question, status } });
      else await api("/api/questions", { json: { question, status } });
      onSaved();
      if (!questionId) setS(empty(outcome));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <L label="Learning outcome" className="sm:col-span-2 lg:col-span-3">
          <select className={inp} value={s.outcomeCode} onChange={(e) => { const o = outcomes.find((x) => x.code === e.target.value)!; setS((x) => ({ ...x, outcomeCode: o.code, subtopicNumber: o.subtopics[0] })); }}>
            {outcomes.map((o) => <option key={o.code} value={o.code}>{o.code} - {o.statement.slice(0, 110)}</option>)}
          </select>
        </L>
        <L label="Sub-topic"><select className={inp} value={s.subtopicNumber} onChange={(e) => set("subtopicNumber", e.target.value)}>{outcome.subtopics.map((n) => <option key={n}>{n}</option>)}</select></L>
        <L label="Question type"><select className={inp} value={s.type} onChange={(e) => set("type", e.target.value as QuestionType)}>{QUESTION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></L>
        <L label="Bloom's level"><select className={inp} value={s.bloom} onChange={(e) => set("bloom", e.target.value)}>{ALL_BLOOMS.map((b) => <option key={b} value={b}>{BLOOM_LABEL[b]}</option>)}</select></L>
        <L label="Assessment domain"><select className={inp} value={s.domain} onChange={(e) => set("domain", e.target.value)}>{Object.entries(DOMAIN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></L>
        <L label="Difficulty"><select className={inp} value={s.difficulty} onChange={(e) => set("difficulty", Number(e.target.value))}><option value={1}>1 - easy</option><option value={2}>2 - standard</option><option value={3}>3 - challenging</option></select></L>
        <L label="Marks"><input type="number" min={1} max={10} className={inp} value={s.marks} onChange={(e) => set("marks", Number(e.target.value))} /></L>
      </div>

      <L label={s.type === "FILL_BLANK" ? "Question (mark each blank as ____)" : s.type === "ASSERTION_REASON" ? "Instruction (optional)" : "Question"}>
        <textarea rows={3} className={inp} value={s.stem} onChange={(e) => set("stem", e.target.value)} />
      </L>

      {s.type === "MCQ" && (
        <fieldset className="space-y-2"><legend className="text-sm">Options (select the correct one)</legend>
          {s.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={s.correctIndex === i} onChange={() => set("correctIndex", i)} aria-label={`Option ${String.fromCharCode(65 + i)} is correct`} />
              <input className={inp + " mt-0"} placeholder={`Option ${String.fromCharCode(65 + i)}`} value={o} onChange={(e) => { const n = [...s.options]; n[i] = e.target.value; set("options", n); }} />
            </div>
          ))}
        </fieldset>
      )}
      {s.type === "TRUE_FALSE" && <L label="Correct answer"><select className={inp} value={String(s.tf)} onChange={(e) => set("tf", e.target.value === "true")}><option value="true">True</option><option value="false">False</option></select></L>}
      {s.type === "FILL_BLANK" && <L label="Accepted answers - one line per blank; separate alternatives with |"><textarea rows={3} className={inp} placeholder={"uniform circular | circular"} value={s.blanks} onChange={(e) => set("blanks", e.target.value)} /></L>}
      {s.type === "MATCHING" && (
        <fieldset className="space-y-2"><legend className="text-sm">Pairs (write each correct pair on one row - the right column is shuffled for students)</legend>
          {s.left.map((l, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input className={inp + " mt-0"} placeholder={`Left ${i + 1}`} value={l} onChange={(e) => { const n = [...s.left]; n[i] = e.target.value; set("left", n); }} />
              <input className={inp + " mt-0"} placeholder={`Matches with…`} value={s.right[i]} onChange={(e) => { const n = [...s.right]; n[i] = e.target.value; set("right", n); }} />
            </div>
          ))}
          {s.left.length < 6 && <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setS((x) => ({ ...x, left: [...x.left, ""], right: [...x.right, ""] }))}>+ Add pair</button>}
        </fieldset>
      )}
      {s.type === "NUMERICAL" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <L label="Correct value"><input className={inp} value={s.value} onChange={(e) => set("value", e.target.value)} placeholder="9.77" /></L>
          <L label="Unit"><input className={inp} value={s.unit} onChange={(e) => set("unit", e.target.value)} placeholder="m s^-2" /></L>
          <L label="Tolerance (%)"><input className={inp} value={s.tolerancePct} onChange={(e) => set("tolerancePct", e.target.value)} /></L>
        </div>
      )}
      {s.type === "ASSERTION_REASON" && (
        <div className="space-y-3">
          <L label="Assertion (A)"><textarea rows={2} className={inp} value={s.assertion} onChange={(e) => set("assertion", e.target.value)} /></L>
          <L label="Reason (R)"><textarea rows={2} className={inp} value={s.reason} onChange={(e) => set("reason", e.target.value)} /></L>
          <L label="Correct option"><select className={inp} value={s.correctIndex} onChange={(e) => set("correctIndex", Number(e.target.value))}>{AR_OPTIONS.map((o, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}. {o}</option>)}</select></L>
        </div>
      )}
      {s.type === "CONCEPTUAL" && (
        <div className="space-y-3">
          <L label="Marking key points (one per line)"><textarea rows={4} className={inp} value={s.keyPoints} onChange={(e) => set("keyPoints", e.target.value)} /></L>
          <L label="Model answer"><textarea rows={4} className={inp} value={s.modelAnswer} onChange={(e) => set("modelAnswer", e.target.value)} /></L>
        </div>
      )}

      <L label="Detailed explanation"><textarea rows={3} className={inp} value={s.explanation} onChange={(e) => set("explanation", e.target.value)} /></L>
      <L label="Common misconception"><textarea rows={2} className={inp} value={s.misconception} onChange={(e) => set("misconception", e.target.value)} /></L>
      <div className="grid gap-3 sm:grid-cols-3">
        {s.hints.map((h, i) => (
          <L key={i} label={`Hint ${i + 1}${i === 0 ? " (concept)" : i === 1 ? " (method)" : " (nearly there)"}`}><textarea rows={2} className={inp} value={h} onChange={(e) => { const n = [...s.hints] as FormState["hints"]; n[i] = e.target.value; set("hints", n); }} /></L>
        ))}
      </div>
      <L label={`Step-by-step solution (one step per line)${s.type === "NUMERICAL" ? " - required" : ""}`}><textarea rows={4} className={inp} placeholder={"Given: …\nFormula: …\nSubstitution: …\nAnswer: …"} value={s.steps} onChange={(e) => set("steps", e.target.value)} /></L>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} className={buttonClass()} onClick={() => save("APPROVED")}>{questionId ? "Save & approve" : "Save & approve"}</button>
        <button disabled={busy} className={buttonClass("secondary")} onClick={() => save("DRAFT")}>Save as draft</button>
      </div>
    </div>
  );
}
