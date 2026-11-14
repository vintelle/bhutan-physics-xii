"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../fetcher";
import { Badge, EmptyState, buttonClass, cx } from "../ui";
import { QuestionForm, fromQuestion, type OutcomeOption } from "./QuestionForm";
import { AR_OPTIONS, BLOOM_LABEL, QUESTION_TYPES, QUIZ_BLOOMS, TYPE_LABEL, ALL_BLOOMS, type QuestionType } from "@/lib/questions";

interface Q {
  id: string; type: QuestionType; bloom: string; status: string; source: string; outcomeCode: string; subtopicNumber: string | null; stem: string;
  payload: Record<string, unknown>; answer: Record<string, unknown>; explanation: string; misconception: string; hints: string[]; solutionSteps: string[]; difficulty: number; marks: number; domain: string;
}
type Tab = "browse" | "write" | "upload" | "generate" | "exemplars";
const inp = "rounded-xl border border-line bg-surface px-3 py-2 text-sm";

function AnswerSummary({ q }: { q: Q }) {
  const p = q.payload as { options?: string[]; left?: string[]; right?: string[]; unit?: string; assertion?: string; reason?: string; keyPoints?: string[] };
  const a = q.answer;
  switch (q.type) {
    case "MCQ": return <ol className="list-[upper-alpha] pl-5">{p.options?.map((o, i) => <li key={i} className={i === a.index ? "font-semibold text-good" : ""}>{o}{i === a.index && " ✓"}</li>)}</ol>;
    case "ASSERTION_REASON": return <div><p><b>A:</b> {p.assertion}</p><p><b>R:</b> {p.reason}</p><p className="text-good">✓ {String.fromCharCode(65 + (a.index as number))}. {AR_OPTIONS[a.index as number]}</p></div>;
    case "TRUE_FALSE": return <p className="text-good">✓ {a.value ? "True" : "False"}</p>;
    case "FILL_BLANK": return <p className="text-good">✓ {(a.blanks as string[][]).map((b) => b.join(" / ")).join(" ; ")}</p>;
    case "MATCHING": return <ul>{p.left?.map((l, i) => <li key={i}>{l} → <span className="text-good">{p.right?.[(a.pairs as number[])[i]]}</span></li>)}</ul>;
    case "NUMERICAL": return <p className="text-good">✓ {String(a.value)} {p.unit} (±{String(a.tolerancePct)}%)</p>;
    case "CONCEPTUAL": return <div><p className="font-medium">Key points</p><ul className="list-disc pl-5">{p.keyPoints?.map((k) => <li key={k}>{k}</li>)}</ul><p className="mt-1 text-ink-soft"><b>Model:</b> {String(a.modelAnswer)}</p></div>;
  }
}

function Browse({ outcomes, initialStatus }: { outcomes: OutcomeOption[]; initialStatus?: string }) {
  const router = useRouter();
  const [f, setF] = useState({ outcome: "", type: "", bloom: "", status: initialStatus ?? "", source: "", q: "" });
  const [data, setData] = useState<{ total: number; items: Q[] }>({ total: 0, items: [] });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams(Object.entries({ ...f, page: String(page) }).filter(([, v]) => v));
    setData(await api(`/api/questions?${qs}`));
  }, [f, page]);
  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: string, status: string) { await api(`/api/questions/${id}`, { method: "PATCH", json: { status } }); await load(); }
  async function remove(id: string) { if (!confirm("Remove this question? (Questions already used are archived instead.)")) return; await api(`/api/questions/${id}`, { method: "DELETE" }); await load(); }
  async function quizFromSelection() {
    const title = prompt("Title for the new quiz:", "Class quiz");
    if (!title) return;
    try {
      const qz = await api<{ id: string }>("/api/quizzes", { json: { title, mode: "TEST", questionIds: [...selected] } });
      setMsg("Quiz created as an unpublished draft.");
      setSelected(new Set());
      router.push(`/teacher/quizzes?created=${qz.id}`);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not create quiz"); }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <select className={inp} value={f.outcome} onChange={(e) => { setPage(1); setF({ ...f, outcome: e.target.value }); }} aria-label="Learning outcome">
          <option value="">All outcomes</option>{outcomes.map((o) => <option key={o.code} value={o.code}>{o.code} {o.topicName}</option>)}
        </select>
        <select className={inp} value={f.type} onChange={(e) => { setPage(1); setF({ ...f, type: e.target.value }); }} aria-label="Type"><option value="">All types</option>{QUESTION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select>
        <select className={inp} value={f.bloom} onChange={(e) => { setPage(1); setF({ ...f, bloom: e.target.value }); }} aria-label="Bloom level"><option value="">All Bloom levels</option>{ALL_BLOOMS.map((b) => <option key={b} value={b}>{BLOOM_LABEL[b]}</option>)}</select>
        <select className={inp} value={f.status} onChange={(e) => { setPage(1); setF({ ...f, status: e.target.value }); }} aria-label="Status"><option value="">Active (draft + approved)</option><option value="DRAFT">Drafts awaiting review</option><option value="APPROVED">Approved</option><option value="ARCHIVED">Archived</option></select>
        <select className={inp} value={f.source} onChange={(e) => { setPage(1); setF({ ...f, source: e.target.value }); }} aria-label="Source"><option value="">Any source</option><option value="SEED">Platform seed</option><option value="TEACHER">Teacher</option><option value="AI_GENERATED">AI generated</option></select>
        <input className={inp} placeholder="Search text…" value={f.q} onChange={(e) => { setPage(1); setF({ ...f, q: e.target.value }); }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="tabular text-ink-soft">{data.total} question{data.total === 1 ? "" : "s"}</p>
        {selected.size > 0 && <button className={buttonClass("primary", "sm")} onClick={quizFromSelection}>Create quiz from {selected.size} selected</button>}
      </div>
      {msg && <p className="mt-2 text-sm text-ink-soft">{msg}</p>}
      {data.items.length === 0 ? <div className="mt-4"><EmptyState title="No questions match these filters" /></div> : (
        <ul className="mt-3 space-y-2">
          {data.items.map((q) => (
            <li key={q.id} className="rounded-xl border border-line bg-raised">
              <div className="flex items-start gap-3 p-3">
                <input type="checkbox" className="mt-1" disabled={q.status !== "APPROVED"} checked={selected.has(q.id)} aria-label="Select for quiz"
                  onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })} />
                <button className="flex-1 text-left" onClick={() => setOpen(open === q.id ? null : q.id)} aria-expanded={open === q.id}>
                  <span className="flex flex-wrap gap-1.5 text-xs">
                    <Badge tone={q.status === "DRAFT" ? "warn" : q.status === "APPROVED" ? "good" : "neutral"}>{q.status === "DRAFT" ? "Draft" : q.status === "APPROVED" ? "Approved" : "Archived"}</Badge>
                    <Badge tone="brand">{TYPE_LABEL[q.type]}</Badge><Badge>{BLOOM_LABEL[q.bloom as "APPLYING"]}</Badge><Badge>{q.outcomeCode}{q.subtopicNumber ? ` · ${q.subtopicNumber}` : ""}</Badge>
                    {q.source === "AI_GENERATED" && <Badge tone="warn">AI</Badge>}
                  </span>
                  <span className="mt-1 block text-sm text-ink">{q.stem}</span>
                </button>
              </div>
              {open === q.id && (
                <div className="space-y-3 border-t border-line p-4 text-sm">
                  {editing === q.id ? (
                    <QuestionForm outcomes={outcomes} questionId={q.id} initial={fromQuestion(q as unknown as Record<string, unknown>, outcomes.find((o) => o.code === q.outcomeCode)!)} onSaved={() => { setEditing(null); void load(); }} />
                  ) : (
                    <>
                      <AnswerSummary q={q} />
                      {q.solutionSteps.length > 0 && <div><p className="font-medium">Solution</p><ol className="list-decimal pl-5 text-ink-soft">{q.solutionSteps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>}
                      <p><b>Explanation:</b> <span className="text-ink-soft">{q.explanation}</span></p>
                      <p><b>Misconception:</b> <span className="text-ink-soft">{q.misconception}</span></p>
                      <ol className="list-decimal pl-5 text-ink-soft">{q.hints.map((h, i) => <li key={i}><b>Hint {i + 1}:</b> {h}</li>)}</ol>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {q.status !== "APPROVED" && <button className={buttonClass("primary", "sm")} onClick={() => setStatus(q.id, "APPROVED")}>Approve</button>}
                        {q.status === "APPROVED" && <button className={buttonClass("secondary", "sm")} onClick={() => setStatus(q.id, "DRAFT")}>Move to draft</button>}
                        <button className={buttonClass("secondary", "sm")} onClick={() => setEditing(q.id)}>Edit</button>
                        <button className={buttonClass("danger", "sm")} onClick={() => remove(q.id)}>Remove</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.total > 25 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button className={buttonClass("secondary", "sm")} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="tabular text-ink-soft">Page {page} of {Math.ceil(data.total / 25)}</span>
          <button className={buttonClass("secondary", "sm")} disabled={page * 25 >= data.total} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

const CSV_TEMPLATE = `type,outcomeCode,subtopicNumber,bloom,domain,difficulty,marks,stem,options,answer,explanation,misconception,hint1,hint2,hint3,solutionSteps,unit,tolerancePct,assertion,reason,left,right,keyPoints
MCQ,XII.EM.15,3.4.6,UNDERSTANDING,SK,2,1,"In a pure capacitor connected to a.c., the current","in phase with voltage|leads voltage by π/2|lags voltage by π/2|lags by π",B,"The capacitor charges and discharges, so current peaks a quarter cycle before voltage.","Mixing up capacitor and inductor behaviour.","Think about when the capacitor's charging current is largest.","Current is largest when voltage is changing fastest.","In C, I leads V.",,,,,,,,
NUMERICAL,XII.EM.15,3.4.6,APPLYING,SK,1,1,"Find the peak value of a 230 V rms supply.",,325,"V0 = √2 × Vrms = 1.414 × 230 = 325 V.","Multiplying by 2 instead of √2.","Relate peak and rms values.","V0 = √2 Vrms.","√2 ≈ 1.414.",Given: Vrms = 230 V|Formula: V0 = √2 Vrms|Answer: 325 V,V,2,,,,,`;

function Upload() {
  const [format, setFormat] = useState<"json" | "csv">("csv");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "APPROVED">("DRAFT");
  const [res, setRes] = useState<{ saved: number; failed: number; results: { row: number; ok: boolean; error?: string }[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">Upload many questions at once. Each row is validated against the curriculum codes and the 7 question formats; valid rows are saved and the rest are reported back to you. The columns are documented in <code>docs/04-api-design.md</code>.</p>
      <div className="flex flex-wrap gap-2">
        <select className={inp} value={format} onChange={(e) => setFormat(e.target.value as "csv")} aria-label="Format"><option value="csv">CSV</option><option value="json">JSON array</option></select>
        <select className={inp} value={status} onChange={(e) => setStatus(e.target.value as "DRAFT")} aria-label="Save as"><option value="DRAFT">Save as drafts (review first)</option><option value="APPROVED">Save as approved</option></select>
        <label className={buttonClass("secondary", "sm")}>Choose file<input type="file" accept=".csv,.json,text/csv,application/json" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setContent(await file.text()); setFormat(file.name.endsWith(".json") ? "json" : "csv"); } }} /></label>
        <button className={buttonClass("ghost", "sm")} onClick={() => { setFormat("csv"); setContent(CSV_TEMPLATE); }}>Load CSV template</button>
      </div>
      <textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} className="w-full rounded-xl border border-line bg-surface p-3 font-mono text-xs" placeholder="Paste CSV or JSON here…" />
      {err && <p className="text-sm text-bad">{err}</p>}
      <button disabled={!content.trim()} className={buttonClass()} onClick={async () => { setErr(null); try { setRes(await api("/api/questions/upload", { json: { format, content, status } })); } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); } }}>Upload</button>
      {res && (
        <div className="rounded-xl border border-line p-3 text-sm">
          <p className="tabular"><span className="text-good">✓ {res.saved} saved</span> · <span className={res.failed ? "text-bad" : "text-ink-muted"}>{res.failed} failed</span></p>
          <ul className="mt-2 space-y-1 text-xs">{res.results.filter((r) => !r.ok).map((r) => <li key={r.row} className="text-bad">Row {r.row}: {r.error}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function Generate({ outcomes, aiEnabled }: { outcomes: OutcomeOption[]; aiEnabled: boolean }) {
  const [g, setG] = useState({ outcomeCode: outcomes[0].code, type: "MCQ" as QuestionType, bloom: "APPLYING", count: 3, difficulty: 2, context: "" });
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ saved: Q[]; rejected: string[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">The AI writes new items for one learning outcome, inside its official sub-topic scope, using the Instructional Guide's exemplar questions as a style guide. Each item comes with an answer, explanation, misconception, three hints and worked steps. <b>Generated items are saved as drafts</b> - review and approve them in the Browse tab before students can see them.</p>
      {!aiEnabled && <p className="rounded-xl border border-warn/30 bg-warn/5 p-3 text-sm">AI generation needs <code>ANTHROPIC_API_KEY</code> to be set on the server.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm sm:col-span-2 lg:col-span-4">Learning outcome<select className={cx(inp, "mt-1 w-full")} value={g.outcomeCode} onChange={(e) => setG({ ...g, outcomeCode: e.target.value })}>{outcomes.map((o) => <option key={o.code} value={o.code}>{o.code} - {o.statement.slice(0, 120)}</option>)}</select></label>
        <label className="text-sm">Type<select className={cx(inp, "mt-1 w-full")} value={g.type} onChange={(e) => setG({ ...g, type: e.target.value as QuestionType })}>{QUESTION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></label>
        <label className="text-sm">Bloom's level<select className={cx(inp, "mt-1 w-full")} value={g.bloom} onChange={(e) => setG({ ...g, bloom: e.target.value })}>{QUIZ_BLOOMS.map((b) => <option key={b} value={b}>{BLOOM_LABEL[b]}</option>)}</select></label>
        <label className="text-sm">How many<input type="number" min={1} max={5} className={cx(inp, "mt-1 w-full")} value={g.count} onChange={(e) => setG({ ...g, count: Math.min(5, Math.max(1, Number(e.target.value))) })} /></label>
        <label className="text-sm">Difficulty<select className={cx(inp, "mt-1 w-full")} value={g.difficulty} onChange={(e) => setG({ ...g, difficulty: Number(e.target.value) })}><option value={1}>Easy</option><option value={2}>Standard</option><option value={3}>Challenging</option></select></label>
        <label className="text-sm sm:col-span-2 lg:col-span-4">Note for the AI <span className="text-ink-muted">(optional, e.g. "use a hydropower context")</span><input className={cx(inp, "mt-1 w-full")} maxLength={500} value={g.context} onChange={(e) => setG({ ...g, context: e.target.value })} /></label>
      </div>
      {err && <p className="text-sm text-bad">{err}</p>}
      <button disabled={busy || !aiEnabled} className={buttonClass()} onClick={async () => {
        setBusy(true); setErr(null); setRes(null);
        try { setRes(await api("/api/questions/generate", { json: { ...g, context: g.context || undefined } })); } catch (e) { setErr(e instanceof Error ? e.message : "Generation failed"); } finally { setBusy(false); }
      }}>{busy ? "Generating… (this can take a minute)" : "Generate questions"}</button>
      {res && (
        <div className="rounded-xl border border-line p-3 text-sm">
          <p><span className="text-good">✓ {res.saved.length} draft(s) saved.</span> {res.rejected.length > 0 && <span className="text-bad">{res.rejected.length} rejected by validation.</span>} Open the Browse tab and filter on "Drafts awaiting review".</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{res.saved.map((q) => <li key={q.id}>{q.stem}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function Exemplars({ outcomes }: { outcomes: OutcomeOption[] }) {
  const [code, setCode] = useState(outcomes[0].code);
  const [items, setItems] = useState<{ id: string; text: string; hasFigure: boolean; subtopicNumber: string }[]>([]);
  useEffect(() => { api<typeof items>(`/api/exemplars?outcome=${code}`).then(setItems).catch(() => setItems([])); }, [code]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">The questions printed in the Physics Instructional Guide (2022) for each sub-topic, word for word. The AI generator uses them as style anchors, and you can adapt them into bank items.</p>
      <select className={cx(inp, "w-full")} value={code} onChange={(e) => setCode(e.target.value)}>{outcomes.map((o) => <option key={o.code} value={o.code}>{o.code} - {o.statement.slice(0, 120)}</option>)}</select>
      {items.length === 0 ? <EmptyState title="No IG exemplar questions for this outcome's sub-topics" /> : (
        <ol className="list-decimal space-y-2 pl-5 text-sm">{items.map((e) => <li key={e.id}>{e.text} <span className="text-xs text-ink-muted">({e.subtopicNumber}{e.hasFigure ? ", needs a figure" : ""})</span></li>)}</ol>
      )}
    </div>
  );
}

export function QuestionBank({ outcomes, aiEnabled, initialTab, initialStatus }: { outcomes: OutcomeOption[]; aiEnabled: boolean; initialTab?: Tab; initialStatus?: string }) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "browse");
  const [key, setKey] = useState(0);
  const tabs: [Tab, string][] = [["browse", "Browse & review"], ["write", "Write a question"], ["upload", "Upload"], ["generate", "Generate with AI"], ["exemplars", "IG exemplars"]];
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1 border-b border-line" role="tablist">
        {tabs.map(([t, l]) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx("-mb-px border-b-2 px-3 py-2 text-sm", tab === t ? "border-brand font-medium text-ink" : "border-transparent text-ink-soft hover:text-ink")}>{l}</button>)}
      </div>
      {tab === "browse" && <Browse key={key} outcomes={outcomes} initialStatus={initialStatus} />}
      {tab === "write" && <QuestionForm outcomes={outcomes} onSaved={() => { setKey((k) => k + 1); setTab("browse"); }} />}
      {tab === "upload" && <Upload />}
      {tab === "generate" && <Generate outcomes={outcomes} aiEnabled={aiEnabled} />}
      {tab === "exemplars" && <Exemplars outcomes={outcomes} />}
    </div>
  );
}
