import { test } from "node:test";
import assert from "node:assert/strict";
import { applyHintPenalty, gradeConceptualByKeywords, gradeObjective, parseNumber } from "./grading";
import { masteryState, nextMasteryScore } from "./mastery";
import { apportion, buildBlueprint, type Candidate } from "./blueprint";
import { questionInputSchema } from "./questions";

test("parseNumber handles plain, scientific and unit-suffixed input", () => {
  assert.equal(parseNumber("9.8 m/s^2"), 9.8);
  assert.equal(parseNumber("1.2e-3"), 0.0012);
  assert.ok(Math.abs(parseNumber("6.5 × 10^-7")! - 6.5e-7) < 1e-20);
  assert.equal(parseNumber("6,500"), 6500);
  assert.equal(parseNumber("abc"), null);
});

test("numerical grading: tolerance, near-miss and power-of-ten slip", () => {
  const ans = { value: 2.0, tolerancePct: 2 };
  assert.equal(gradeObjective("NUMERICAL", ans, { value: "2.03" }).credit, 1);
  assert.equal(gradeObjective("NUMERICAL", ans, { value: "2.08" }).credit, 0.5);
  const slip = gradeObjective("NUMERICAL", ans, { value: "200" });
  assert.equal(slip.credit, 0);
  assert.match(slip.note ?? "", /10\^2/);
});

test("fill-in-the-blank accepts alternatives, case-insensitively, with partial credit", () => {
  const ans = { blanks: [["Simple harmonic", "SHM"], ["opposite"]] };
  assert.equal(gradeObjective("FILL_BLANK", ans, { blanks: ["shm", "Opposite"] }).credit, 1);
  assert.equal(gradeObjective("FILL_BLANK", ans, { blanks: ["shm", "same"] }).credit, 0.5);
});

test("matching gives per-pair credit", () => {
  const r = gradeObjective("MATCHING", { pairs: [2, 0, 1] }, { pairs: [2, 1, 0] });
  assert.deepEqual(r.parts, [true, false, false]);
});

test("hint penalty is 15% per hint with a 40% floor", () => {
  assert.equal(applyHintPenalty(1, 0), 1);
  assert.equal(applyHintPenalty(1, 2), 0.7);
  assert.equal(applyHintPenalty(1, 3), 0.55);
  assert.equal(applyHintPenalty(0, 3), 0);
});

test("keyword grading of conceptual answers", () => {
  const kp = ["Coherent sources have a constant phase difference", "Same frequency is required"];
  assert.equal(gradeConceptualByKeywords(kp, "They need a constant phase difference and the same frequency.").credit, 1);
  assert.equal(gradeConceptualByKeywords(kp, "no idea").credit, 0);
});

test("mastery EWMA and states", () => {
  let s = 0;
  [1, 1, 1, 1].forEach((c, i) => (s = nextMasteryScore(s, i, c)));
  assert.equal(masteryState(s, 4), "mastered");
  assert.equal(masteryState(0.3, 2), "weak");
  assert.equal(masteryState(0.9, 2), "learning");
});

test("apportion follows IG weighting exactly", () => {
  assert.deepEqual(apportion({ a: 12, b: 7, c: 3 }, 22), { a: 12, b: 7, c: 3 });
  const r = apportion({ a: 1, b: 1, c: 1 }, 10);
  assert.equal(r.a + r.b + r.c, 10);
});

test("blueprint respects topic weights and ramps Bloom order", () => {
  const blooms = ["REMEMBERING", "UNDERSTANDING", "APPLYING", "ANALYSING", "EVALUATING"] as const;
  const cands: Candidate[] = [];
  for (const t of ["EM.4", "NM.1"]) for (let i = 0; i < 20; i++)
    cands.push({ id: `${t}-${i}`, topicCode: t, outcomeCode: `XII.${t.split(".")[0]}.0${i % 3 + 1}`, bloom: blooms[i % 5], type: "MCQ", difficulty: 2, marks: 1, timesUsed: 0 });
  const r = buildBlueprint(cands, { questionCount: 10, topicWeights: { "EM.4": 12, "NM.1": 12 }, seed: 7 });
  assert.equal(r.questionIds.length, 10);
  assert.equal(r.perTopic["EM.4"].picked, 5);
  const order = r.questionIds.map((id) => cands.find((c) => c.id === id)!.bloom);
  const idx = order.map((b) => (blooms as readonly string[]).indexOf(b));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b));
});

test("question schema rejects a fill-blank with mismatched blanks", () => {
  const bad = questionInputSchema.safeParse({
    type: "FILL_BLANK", bloom: "REMEMBERING", outcomeCode: "XII.NM.01", stem: "SHM is ____ motion.",
    answer: { blanks: [["periodic"], ["extra"]] }, explanation: "Because SHM repeats.", misconception: "None really.",
    hints: ["h1 a", "h2 b", "h3 c"],
  });
  assert.equal(bad.success, false);
});

test("every seed item's own answer key grades as fully correct", async () => {
  const { seedQuestions } = await import("../../prisma/seed-questions");
  const { gradeObjective } = await import("./grading");
  for (const q of seedQuestions) {
    if (q.type === "CONCEPTUAL") continue;
    const a = q.answer as Record<string, unknown>;
    const response =
      q.type === "MCQ" || q.type === "ASSERTION_REASON" ? { index: a.index } :
      q.type === "TRUE_FALSE" ? { value: a.value } :
      q.type === "FILL_BLANK" ? { blanks: (a.blanks as string[][]).map((b) => b[0]) } :
      q.type === "MATCHING" ? { pairs: a.pairs } : { value: String(a.value) };
    const r = gradeObjective(q.type, q.answer, response);
    assert.equal(r.credit, 1, `${q.outcomeCode} ${q.type}: ${q.stem.slice(0, 60)}`);
  }
});

test("seed bank covers all 47 outcomes and all 7 types", async () => {
  const { seedQuestions } = await import("../../prisma/seed-questions");
  const { curriculum } = await import("./curriculum");
  const covered = new Set(seedQuestions.map((q) => q.outcomeCode));
  for (const o of curriculum.learning_objectives) assert.ok(covered.has(o.code), `no item for ${o.code}`);
  assert.equal(new Set(seedQuestions.map((q) => q.type)).size, 7);
});
