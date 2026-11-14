import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, ok, parseBody, requireUser } from "@/lib/api";
import { outcomeByCode, topicByCode } from "@/lib/curriculum";
import { QUESTION_TYPES } from "@/lib/questions";
import { startPractice, startQuiz } from "@/lib/services/attempts";

const Body = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("practice"), outcomes: z.array(z.string()).min(1).max(47), count: z.number().int().min(1).max(30).default(10), types: z.array(z.enum(QUESTION_TYPES)).optional(), title: z.string().max(120).optional() }),
  z.object({ kind: z.literal("review"), count: z.number().int().min(1).max(30).default(10) }),
  z.object({ kind: z.literal("quiz"), quizId: z.string() }),
]);

export const GET = handler(async () => {
  const u = await requireUser();
  return ok(await prisma.attempt.findMany({ where: { userId: u.id }, orderBy: { startedAt: "desc" }, take: 50, select: { id: true, title: true, mode: true, status: true, score: true, maxScore: true, startedAt: true, submittedAt: true, _count: { select: { items: true } } } }));
});

export const POST = handler(async (req: Request) => {
  const u = await requireUser();
  const b = await parseBody(req, Body);
  if (b.kind === "quiz") return ok(await startQuiz(u, b.quizId), 201);
  if (b.kind === "review") {
    // Smart review: the learner's weakest started outcomes (falls back to least-practised ones).
    const ms = await prisma.mastery.findMany({ where: { userId: u.id }, orderBy: { score: "asc" }, take: 4 });
    const outcomes = ms.length ? ms.map((m) => m.outcomeCode) : [...outcomeByCode.keys()].slice(0, 4);
    return ok(await startPractice(u, { outcomes, count: b.count }, "Smart review: weakest outcomes"), 201);
  }
  const valid = b.outcomes.filter((c) => outcomeByCode.has(c));
  const first = outcomeByCode.get(valid[0]);
  const title = b.title ?? (valid.length === 1 ? `Practice ${valid[0]}` : `Practice: ${topicByCode.get(first?.topic ?? "")?.name ?? "mixed topics"}`);
  return ok(await startPractice(u, { outcomes: valid, count: b.count, types: b.types }, title), 201);
});
