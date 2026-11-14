import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { handler, ok, parseBody, requireUser } from "@/lib/api";
import { ALL_BLOOMS, QUESTION_TYPES, questionInputSchema } from "@/lib/questions";
import { saveQuestion } from "@/lib/questionIO";

const Filters = z.object({
  outcome: z.string().optional(),
  topic: z.string().optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  bloom: z.enum(ALL_BLOOMS).optional(),
  status: z.enum(["DRAFT", "APPROVED", "ARCHIVED"]).optional(),
  source: z.enum(["SEED", "TEACHER", "AI_GENERATED", "IG_ADAPTED"]).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const GET = handler(async (req: Request) => {
  await requireUser({ teacher: true });
  const f = Filters.parse(Object.fromEntries(new URL(req.url).searchParams));
  const where: Prisma.QuestionWhereInput = {
    ...(f.outcome ? { outcomeCode: f.outcome } : {}),
    ...(f.topic ? { outcome: { topicCode: f.topic } } : {}),
    ...(f.type ? { type: f.type } : {}),
    ...(f.bloom ? { bloom: f.bloom } : {}),
    ...(f.status ? { status: f.status } : { status: { not: "ARCHIVED" } }),
    ...(f.source ? { source: f.source } : {}),
    ...(f.q ? { stem: { contains: f.q, mode: "insensitive" } } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({ where, orderBy: [{ status: "asc" }, { outcomeCode: "asc" }, { createdAt: "desc" }], skip: (f.page - 1) * f.pageSize, take: f.pageSize }),
  ]);
  return ok({ total, page: f.page, pageSize: f.pageSize, items });
});

/** Teacher-authored items are approved on save; pass status "DRAFT" to keep one for later. */
export const POST = handler(async (req: Request) => {
  const u = await requireUser({ teacher: true });
  const body = await parseBody(req, z.object({ question: questionInputSchema, status: z.enum(["DRAFT", "APPROVED"]).default("APPROVED") }));
  return ok(await saveQuestion(body.question, { authorId: u.id, source: "TEACHER", status: body.status }), 201);
});
