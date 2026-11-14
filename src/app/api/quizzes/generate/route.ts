import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError, handler, ok, parseBody, requireUser } from "@/lib/api";
import { buildBlueprint, type Candidate } from "@/lib/blueprint";
import { curriculum } from "@/lib/curriculum";
import { ALL_BLOOMS, QUESTION_TYPES, type Bloom } from "@/lib/questions";

const Body = z.object({
  title: z.string().trim().min(3).max(120),
  mode: z.enum(["PRACTICE", "TEST"]).default("TEST"),
  timeLimitMin: z.number().int().min(5).max(240).optional(),
  classId: z.string().optional(),
  published: z.boolean().default(false),
  topics: z.array(z.string()).min(1).describe("Topic codes, e.g. ['EM.3','EM.4']"),
  questionCount: z.number().int().min(3).max(60),
  bloomMix: z.record(z.enum(ALL_BLOOMS), z.number().min(0)).optional(),
  types: z.array(z.enum(QUESTION_TYPES)).optional(),
  preview: z.boolean().default(false),
});

/** Test generator: weighted by IG Annexure 2, balanced across Bloom levels and outcomes, ramped in demand. */
export const POST = handler(async (req: Request) => {
  const u = await requireUser({ teacher: true });
  const b = await parseBody(req, Body);
  if (b.classId && !(await prisma.class.findFirst({ where: { id: b.classId, teacherId: u.id } }))) throw new HttpError(403, "That class is not yours.");
  const topicWeights = Object.fromEntries(curriculum.topics.filter((t) => b.topics.includes(t.code)).map((t) => [t.code, t.weighting]));
  if (Object.keys(topicWeights).length === 0) throw new HttpError(422, "Choose at least one valid topic.");
  const qs = await prisma.question.findMany({
    where: { status: "APPROVED", outcome: { topicCode: { in: Object.keys(topicWeights) } } },
    select: { id: true, outcomeCode: true, bloom: true, type: true, difficulty: true, marks: true, outcome: { select: { topicCode: true } }, _count: { select: { attemptItems: true } } },
  });
  const candidates: Candidate[] = qs.map((q) => ({ id: q.id, topicCode: q.outcome.topicCode, outcomeCode: q.outcomeCode, bloom: q.bloom as Bloom, type: q.type, difficulty: q.difficulty, marks: q.marks, timesUsed: q._count.attemptItems }));
  const plan = buildBlueprint(candidates, { questionCount: b.questionCount, topicWeights, bloomMix: b.bloomMix, types: b.types });
  if (plan.questionIds.length === 0) throw new HttpError(422, "No approved questions match this blueprint yet.");
  if (b.preview) return ok({ plan });
  const quiz = await prisma.quiz.create({
    data: {
      title: b.title, mode: b.mode, timeLimitMin: b.timeLimitMin, classId: b.classId, published: b.published, createdById: u.id,
      blueprint: { request: { topics: b.topics, questionCount: b.questionCount, bloomMix: b.bloomMix ?? null, types: b.types ?? null }, perTopic: plan.perTopic, perBloom: plan.perBloom, shortfall: plan.shortfall } as Prisma.InputJsonValue,
      questions: { create: plan.questionIds.map((questionId, order) => ({ questionId, order })) },
    },
  });
  return ok({ quiz, plan }, 201);
});
