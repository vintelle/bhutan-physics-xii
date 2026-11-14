import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { outcomeByCode } from "./curriculum";
import { questionInputSchema, type QuestionInput } from "./questions";

export async function saveQuestion(q: QuestionInput, opts: { authorId?: string; source: "SEED" | "TEACHER" | "AI_GENERATED" | "IG_ADAPTED"; status: "DRAFT" | "APPROVED"; exemplarId?: string }) {
  const outcome = outcomeByCode.get(q.outcomeCode);
  if (!outcome) throw new Error(`Unknown learning outcome ${q.outcomeCode}`);
  const subtopicNumber = q.subtopicNumber && outcome.subtopics.includes(q.subtopicNumber) ? q.subtopicNumber : outcome.subtopics[0];
  return prisma.question.create({
    data: {
      type: q.type,
      bloom: q.bloom,
      domain: q.domain,
      difficulty: q.difficulty,
      marks: q.marks,
      stem: q.stem,
      payload: q.payload as Prisma.InputJsonValue,
      answer: q.answer as Prisma.InputJsonValue,
      explanation: q.explanation,
      misconception: q.misconception,
      hints: q.hints,
      solutionSteps: q.solutionSteps,
      scopeNote: q.scopeNote ?? null,
      outcomeCode: q.outcomeCode,
      subtopicNumber,
      source: opts.source,
      status: opts.status,
      authorId: opts.authorId,
      exemplarId: opts.exemplarId,
    },
  });
}

/** RFC-4180-ish CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  const [header, ...body] = rows;
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const list = (s?: string) => (s ? s.split("|").map((x) => x.trim()).filter(Boolean) : []);
const letterIndex = (s: string) => (/^[A-Ea-e]$/.test(s) ? s.toUpperCase().charCodeAt(0) - 65 : Number(s));

/** Map one CSV row (columns documented in docs/04-api-design.md) to a validated QuestionInput. */
export function csvRowToInput(r: Record<string, string>): QuestionInput {
  const type = r.type?.toUpperCase();
  let payload: Record<string, unknown> = {}, answer: Record<string, unknown> = {};
  switch (type) {
    case "MCQ": payload = { options: list(r.options) }; answer = { index: letterIndex(r.answer) }; break;
    case "TRUE_FALSE": answer = { value: /^(true|t|yes|1)$/i.test(r.answer) }; break;
    case "FILL_BLANK": answer = { blanks: r.answer.split("||").map(list) }; break;
    case "MATCHING": {
      const left = list(r.left), right = list(r.right); // right given in matching order
      const order = right.map((_, i) => i).sort(() => Math.random() - 0.5);
      payload = { left, right: order.map((i) => right[i]) };
      answer = { pairs: left.map((_, i) => order.indexOf(i)) };
      break;
    }
    case "NUMERICAL": payload = { unit: r.unit ?? "" }; answer = { value: Number(r.answer), tolerancePct: r.tolerancePct ? Number(r.tolerancePct) : 2 }; break;
    case "ASSERTION_REASON": payload = { assertion: r.assertion, reason: r.reason }; answer = { index: letterIndex(r.answer) }; break;
    case "CONCEPTUAL": payload = { keyPoints: list(r.keyPoints) }; answer = { modelAnswer: r.answer }; break;
  }
  return questionInputSchema.parse({
    type,
    outcomeCode: r.outcomeCode,
    subtopicNumber: r.subtopicNumber || null,
    bloom: r.bloom?.toUpperCase(),
    domain: (r.domain || "SK").toUpperCase(),
    difficulty: r.difficulty ? Number(r.difficulty) : 2,
    marks: r.marks ? Number(r.marks) : 1,
    stem: r.stem,
    payload,
    answer,
    explanation: r.explanation,
    misconception: r.misconception,
    hints: [r.hint1, r.hint2, r.hint3],
    solutionSteps: list(r.solutionSteps),
  });
}
