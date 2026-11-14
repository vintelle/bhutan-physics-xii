import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { QuizBuilder } from "@/components/teacher/QuizBuilder";
import { QuizList } from "@/components/teacher/QuizList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quizzes & tests" };

export default async function QuizzesPage() {
  const user = await requirePageUser(["TEACHER", "ADMIN"]);
  const [themes, counts, classes, quizzes] = await Promise.all([
    prisma.theme.findMany({ orderBy: { order: "asc" }, include: { topics: { orderBy: { order: "asc" } } } }),
    prisma.question.findMany({ where: { status: "APPROVED" }, select: { outcome: { select: { topicCode: true } } } }),
    prisma.class.findMany({ where: { teacherId: user.id }, select: { id: true, name: true } }),
    prisma.quiz.findMany({ where: { createdById: user.id }, orderBy: { createdAt: "desc" }, include: { class: { select: { name: true } }, _count: { select: { questions: true, attempts: true } } } }),
  ]);
  const perTopic = new Map<string, number>();
  counts.forEach((c) => perTopic.set(c.outcome.topicCode, (perTopic.get(c.outcome.topicCode) ?? 0) + 1));
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title="Quizzes & tests">Generate a balanced test in seconds. It follows the curriculum weighting and your chosen Bloom's mix, then orders questions from lower to higher demand.</PageHeader>
      <Card><h2 className="mb-4 font-medium">Test generator</h2><QuizBuilder classes={classes} themes={themes.map((t) => ({ code: t.code, name: t.name, topics: t.topics.map((tp) => ({ code: tp.code, name: tp.name, weighting: tp.weighting, approved: perTopic.get(tp.code) ?? 0 })) }))} /></Card>
      <Card><h2 className="font-medium">Your quizzes</h2><QuizList quizzes={quizzes.map((q) => ({ id: q.id, title: q.title, mode: q.mode, published: q.published, timeLimitMin: q.timeLimitMin, className: q.class?.name ?? null, questions: q._count.questions, attempts: q._count.attempts, createdAt: q.createdAt.toISOString() }))} /></Card>
    </div>
  );
}
