import { z } from "zod";
import { HttpError, handler, ok, parseBody, requireUser } from "@/lib/api";
import { AiRefusalError, AiUnavailableError, aiEnabled } from "@/lib/ai/client";
import { generateQuestions } from "@/lib/ai/generate";
import { QUESTION_TYPES, QUIZ_BLOOMS } from "@/lib/questions";
import { saveQuestion } from "@/lib/questionIO";

export const maxDuration = 300;

const Body = z.object({
  outcomeCode: z.string(),
  type: z.enum(QUESTION_TYPES),
  bloom: z.enum(QUIZ_BLOOMS),
  count: z.number().int().min(1).max(5),
  difficulty: z.number().int().min(1).max(3).optional(),
  context: z.string().max(500).optional(),
});

/** AI question generation. Items are saved as DRAFT and must be approved by a teacher before students see them. */
export const POST = handler(async (req: Request) => {
  const u = await requireUser({ teacher: true });
  if (!aiEnabled()) throw new HttpError(503, new AiUnavailableError().message);
  const b = await parseBody(req, Body);
  try {
    const { items, rejected } = await generateQuestions(b);
    const saved = [];
    for (const q of items) saved.push(await saveQuestion(q, { authorId: u.id, source: "AI_GENERATED", status: "DRAFT" }));
    return ok({ saved, rejected }, 201);
  } catch (e) {
    if (e instanceof AiRefusalError) throw new HttpError(422, "The AI declined to write these items. Try rephrasing the teacher's note.");
    throw e;
  }
});
