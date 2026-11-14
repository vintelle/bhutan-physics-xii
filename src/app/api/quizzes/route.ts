import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError, handler, ok, parseBody, requireUser } from "@/lib/api";
import { isTeacher } from "@/lib/auth";

export const GET = handler(async () => {
  const u = await requireUser();
  if (isTeacher(u)) {
    return ok(await prisma.quiz.findMany({
      where: { createdById: u.id },
      include: { class: { select: { name: true } }, _count: { select: { questions: true, attempts: true } } },
      orderBy: { createdAt: "desc" },
    }));
  }
  const classIds = (await prisma.enrollment.findMany({ where: { userId: u.id }, select: { classId: true } })).map((e) => e.classId);
  const quizzes = await prisma.quiz.findMany({
    where: { published: true, OR: [{ classId: { in: classIds } }, { classId: null }] },
    include: { _count: { select: { questions: true } }, attempts: { where: { userId: u.id }, select: { id: true, status: true, score: true, maxScore: true }, orderBy: { startedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  return ok(quizzes);
});

const Body = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().max(1000).optional(),
  mode: z.enum(["PRACTICE", "TEST"]).default("TEST"),
  timeLimitMin: z.number().int().min(5).max(240).optional(),
  classId: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  published: z.boolean().default(false),
  questionIds: z.array(z.string()).min(1).max(100),
});

/** Create a quiz from hand-picked questions (teacher). */
export const POST = handler(async (req: Request) => {
  const u = await requireUser({ teacher: true });
  const b = await parseBody(req, Body);
  if (b.classId && !(await prisma.class.findFirst({ where: { id: b.classId, teacherId: u.id } }))) throw new HttpError(403, "That class is not yours.");
  const approved = await prisma.question.count({ where: { id: { in: b.questionIds }, status: "APPROVED" } });
  if (approved !== b.questionIds.length) throw new HttpError(422, "All questions in a quiz must be approved.");
  const quiz = await prisma.quiz.create({
    data: {
      title: b.title, description: b.description, mode: b.mode, timeLimitMin: b.timeLimitMin, classId: b.classId,
      dueAt: b.dueAt ? new Date(b.dueAt) : undefined, published: b.published, createdById: u.id,
      questions: { create: b.questionIds.map((questionId, order) => ({ questionId, order })) },
    },
  });
  return ok(quiz, 201);
});
