import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { outcomeByCode, subtopicByNumber, exemplarsForOutcome } from "../curriculum";
import { BLOOM_LABEL, questionInputSchema, TYPE_LABEL, type Bloom, type QuestionInput, type QuestionType, AR_OPTIONS } from "../questions";
import { FALLBACK_BETA, MODEL, assertNotRefused, claude, systemBlocks } from "./client";

const common = {
  subtopicNumber: z.string().describe("The sub-topic number (e.g. 3.4.3) this item assesses; must be one listed for the outcome."),
  stem: z.string().describe("The question text as the student sees it."),
  domain: z.enum(["SK", "WS", "SV"]),
  difficulty: z.number().int().describe("1 easy, 2 standard, 3 challenging"),
  explanation: z.string().describe("Detailed explanation of why the answer is correct, in simple language, 60-150 words."),
  misconception: z.string().describe("The most common misconception a Class XII learner has here and how to correct it."),
  hints: z.array(z.string()).describe("Exactly three hints, graduated: 1 points to the relevant concept/law, 2 gives the relationship or method, 3 nearly gives the answer without stating it."),
  solutionSteps: z.array(z.string()).describe("Step-by-step working. Required for numerical items (Given -> Formula -> Substitution -> Answer with unit); may be empty otherwise."),
};

const genSchemas = {
  MCQ: z.object({ ...common, options: z.array(z.string()).describe("4 options, one correct, distractors based on real misconceptions"), correctIndex: z.number().int() }),
  TRUE_FALSE: z.object({ ...common, correct: z.boolean() }),
  FILL_BLANK: z.object({ ...common, blanks: z.array(z.array(z.string())).describe("For each ____ in the stem (in order), the list of acceptable answers") }),
  MATCHING: z.object({ ...common, left: z.array(z.string()).describe("4-5 items"), right: z.array(z.string()).describe("Same length; right[i] is the correct match for left[i]") }),
  NUMERICAL: z.object({ ...common, answerValue: z.number(), unit: z.string().describe("SI unit of the answer, e.g. 'm s^-2', or '' if dimensionless"), tolerancePct: z.number().describe("Accepted relative error, normally 2") }),
  ASSERTION_REASON: z.object({ ...common, assertion: z.string(), reason: z.string(), correctIndex: z.number().int().describe("0-4 using the standard key") }),
  CONCEPTUAL: z.object({ ...common, keyPoints: z.array(z.string()).describe("3-5 marking points a full answer must contain"), modelAnswer: z.string() }),
} satisfies Record<QuestionType, z.ZodTypeAny>;

const TYPE_RULES: Record<QuestionType, string> = {
  MCQ: "Four options, exactly one correct; every distractor must reflect a genuine misconception or calculation slip, not a silly option. Avoid 'all of the above'.",
  TRUE_FALSE: "One unambiguous statement; avoid double negatives and absolute words that give the answer away.",
  FILL_BLANK: "Mark each blank in the stem as ____ (four underscores). 1-2 blanks. List all reasonable accepted spellings/synonyms.",
  MATCHING: "4-5 pairs on one coherent idea (e.g. quantity <-> unit, device <-> principle, sub-system <-> function). Every right item matches exactly one left item.",
  NUMERICAL: "A realistic problem with given data in SI or easily converted units; give the final value in the stated unit. solutionSteps must show Given, Formula, Substitution, Answer (with unit and sensible significant figures).",
  ASSERTION_REASON: `Assertion (A) and Reason (R) are each one sentence. The student chooses from this standard key, index 0-4: ${AR_OPTIONS.map((o, i) => `${i}: ${o}`).join(" | ")}. Put only the question context in the stem (e.g. 'Read the assertion and reason.').`,
  CONCEPTUAL: "An explain/justify/compare/evaluate question answerable in 3-6 sentences; keyPoints are the marking criteria.",
};

export interface GenerateRequest {
  outcomeCode: string;
  type: QuestionType;
  bloom: Bloom;
  count: number;
  difficulty?: number;
  context?: string;
}

/** Convert one structured-output item into the platform's QuestionInput (validated). */
function toQuestionInput(type: QuestionType, bloom: Bloom, outcomeCode: string, g: Record<string, unknown>): QuestionInput {
  const base = {
    type, bloom, outcomeCode,
    subtopicNumber: g.subtopicNumber as string,
    stem: g.stem as string,
    domain: g.domain as "SK",
    difficulty: Math.min(3, Math.max(1, Number(g.difficulty) || 2)),
    explanation: g.explanation as string,
    misconception: g.misconception as string,
    hints: (g.hints as string[]).slice(0, 3),
    solutionSteps: (g.solutionSteps as string[]) ?? [],
  };
  let payload: Record<string, unknown> = {};
  let answer: Record<string, unknown> = {};
  switch (type) {
    case "MCQ": payload = { options: g.options }; answer = { index: g.correctIndex }; break;
    case "TRUE_FALSE": answer = { value: g.correct }; break;
    case "FILL_BLANK": answer = { blanks: g.blanks }; break;
    case "MATCHING": {
      // Shuffle the right column so it is not in answer order.
      const left = g.left as string[], right = g.right as string[];
      const order = right.map((_, i) => i).sort(() => Math.random() - 0.5);
      const shuffled = order.map((i) => right[i]);
      payload = { left, right: shuffled };
      answer = { pairs: left.map((_, i) => order.indexOf(i)) };
      break;
    }
    case "NUMERICAL": payload = { unit: g.unit }; answer = { value: g.answerValue, tolerancePct: Number(g.tolerancePct) || 2 }; break;
    case "ASSERTION_REASON": payload = { assertion: g.assertion, reason: g.reason }; answer = { index: g.correctIndex }; break;
    case "CONCEPTUAL": payload = { keyPoints: g.keyPoints }; answer = { modelAnswer: g.modelAnswer }; break;
  }
  return questionInputSchema.parse({ ...base, payload, answer });
}

/** Generate curriculum-aligned items with full feedback. Results are DRAFTs for teacher review. */
export async function generateQuestions(req: GenerateRequest): Promise<{ items: QuestionInput[]; rejected: string[] }> {
  const outcome = outcomeByCode.get(req.outcomeCode);
  if (!outcome) throw new Error(`Unknown learning outcome ${req.outcomeCode}`);
  if (req.bloom === "CREATING") throw new Error("Creating-level outcomes are assessed through performance tasks, not quiz items.");
  const subs = outcome.subtopics.map((n) => subtopicByNumber.get(n)!);
  const exemplars = exemplarsForOutcome(outcome.code);
  const schema = z.object({ items: z.array(genSchemas[req.type]) });

  const task = `Write ${req.count} new ${TYPE_LABEL[req.type]} item(s) at Bloom's level "${BLOOM_LABEL[req.bloom]}"${req.difficulty ? `, difficulty ${req.difficulty}` : ""}.

Learning outcome ${outcome.code} (${outcome.source_ref}): ${outcome.statement}
Scientific practices for this outcome: ${outcome.sep.join("; ")}.
Sub-topics and official scope:
${subs.map((s) => `- ${s.number} ${s.title}: ${s.scope}`).join("\n")}
${exemplars.length ? `\nInstructional Guide exemplar questions for this outcome (match their level and style; do not copy them):\n${exemplars.map((e) => `- ${e.text}`).join("\n")}` : ""}
${req.context ? `\nTeacher's note: ${req.context}` : ""}

Item rules: ${TYPE_RULES[req.type]}
The Bloom level must be genuine: Remembering = recall a fact/definition; Understanding = explain/interpret; Applying = use a relation or procedure in a new case; Analysing = compare, interpret data/graphs, break down; Evaluating = judge, justify, critique a claim with evidence.
Each item must assess this outcome inside the listed scope only, be self-contained (no figures), and differ clearly from the others.`;

  const response = await claude().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "high", format: betaZodOutputFormat(schema) },
    system: systemBlocks("You are an assessment specialist and physics educator writing items for the platform's question bank. Accuracy of every number, unit and answer key matters more than anything else - solve each item yourself before finalising it."),
    messages: [{ role: "user", content: task }],
  });
  assertNotRefused(response);
  const parsed = response.parsed_output;
  if (!parsed) throw new Error("The AI response could not be parsed.");
  const items: QuestionInput[] = [];
  const rejected: string[] = [];
  for (const g of parsed.items) {
    try {
      const q = toQuestionInput(req.type, req.bloom, outcome.code, g as Record<string, unknown>);
      if (q.subtopicNumber && !outcome.subtopics.includes(q.subtopicNumber)) q.subtopicNumber = outcome.subtopics[0];
      items.push(q);
    } catch (e) {
      rejected.push(e instanceof z.ZodError ? e.issues.map((i) => `${i.path.join(".") || "item"}: ${i.message}`).join("; ").slice(0, 300) : e instanceof Error ? e.message.slice(0, 300) : "invalid item");
    }
  }
  return { items, rejected };
}
