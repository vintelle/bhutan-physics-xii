import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError, handler, ok, parseBody, requireUser } from "@/lib/api";
import { questionInputSchema } from "@/lib/questions";

type Ctx = { params: { id: string } };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser({ teacher: true });
  const q = await prisma.question.findUnique({ where: { id: params.id }, include: { outcome: true, subtopic: true } });
  if (!q) throw new HttpError(404, "Question not found.");
  return ok(q);
});

/** Review workflow: approve / archive, or replace content (re-validated as a whole). */
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const u = await requireUser({ teacher: true });
  const body = await parseBody(req, z.object({ status: z.enum(["DRAFT", "APPROVED", "ARCHIVED"]).optional(), question: questionInputSchema.optional() }));
  const data: Prisma.QuestionUpdateInput = {};
  if (body.question) {
    const q = body.question;
    Object.assign(data, {
      type: q.type, bloom: q.bloom, domain: q.domain, difficulty: q.difficulty, marks: q.marks, stem: q.stem,
      payload: q.payload as Prisma.InputJsonValue, answer: q.answer as Prisma.InputJsonValue, explanation: q.explanation,
      misconception: q.misconception, hints: q.hints, solutionSteps: q.solutionSteps, scopeNote: q.scopeNote ?? null,
      outcome: { connect: { code: q.outcomeCode } }, ...(q.subtopicNumber ? { subtopic: { connect: { number: q.subtopicNumber } } } : {}),
    });
  }
  if (body.status) {
    data.status = body.status;
    if (body.status === "APPROVED") data.reviewer = { connect: { id: u.id } };
  }
  return ok(await prisma.question.update({ where: { id: params.id }, data }));
});

/** Questions already used in attempts are archived (kept for analytics); unused ones are deleted. */
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser({ teacher: true });
  const used = await prisma.attemptItem.count({ where: { questionId: params.id } });
  if (used) await prisma.question.update({ where: { id: params.id }, data: { status: "ARCHIVED" } });
  else await prisma.question.delete({ where: { id: params.id } });
  return ok({ archived: used > 0, deleted: used === 0 });
});
