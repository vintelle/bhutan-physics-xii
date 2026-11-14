import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError, handler, ok, parseBody, requireUser } from "@/lib/api";
import { isTeacher } from "@/lib/auth";

type Ctx = { params: { id: string } };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const u = await requireUser();
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: { class: true, questions: { orderBy: { order: "asc" }, include: { question: isTeacher(u) } }, _count: { select: { attempts: true } } },
  });
  if (!quiz || (!isTeacher(u) && !quiz.published)) throw new HttpError(404, "Quiz not found.");
  if (isTeacher(u) && quiz.createdById !== u.id && u.role !== "ADMIN") throw new HttpError(403, "Not your quiz.");
  if (isTeacher(u)) {
    const results = await prisma.attempt.findMany({ where: { quizId: quiz.id, status: "SUBMITTED" }, include: { user: { select: { name: true } } }, orderBy: { submittedAt: "desc" } });
    return ok({ ...quiz, results });
  }
  return ok({ id: quiz.id, title: quiz.title, description: quiz.description, mode: quiz.mode, timeLimitMin: quiz.timeLimitMin, dueAt: quiz.dueAt, questionCount: quiz.questions.length });
});

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const u = await requireUser({ teacher: true });
  const b = await parseBody(req, z.object({ published: z.boolean().optional(), title: z.string().min(3).max(120).optional(), timeLimitMin: z.number().int().min(5).max(240).nullable().optional() }));
  const quiz = await prisma.quiz.findUnique({ where: { id: params.id } });
  if (!quiz || quiz.createdById !== u.id) throw new HttpError(404, "Quiz not found.");
  return ok(await prisma.quiz.update({ where: { id: quiz.id }, data: b }));
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const u = await requireUser({ teacher: true });
  const quiz = await prisma.quiz.findUnique({ where: { id: params.id } });
  if (!quiz || quiz.createdById !== u.id) throw new HttpError(404, "Quiz not found.");
  await prisma.quiz.delete({ where: { id: quiz.id } });
  return ok({ deleted: true });
});
