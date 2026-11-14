import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { BLOOM_LABEL, TYPE_LABEL } from "@/lib/questions";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { StartButton } from "@/components/StartButton";

export const dynamic = "force-dynamic";

export default async function QuizDetail({ params }: { params: { id: string } }) {
  const user = await requirePageUser(["TEACHER", "ADMIN"]);
  const quiz = await prisma.quiz.findUnique({ where: { id: params.id }, include: { class: true, questions: { orderBy: { order: "asc" }, include: { question: true } } } });
  if (!quiz || (quiz.createdById !== user.id && user.role !== "ADMIN")) notFound();
  const results = await prisma.attempt.findMany({ where: { quizId: quiz.id, status: "SUBMITTED" }, include: { user: { select: { id: true, name: true } } }, orderBy: { submittedAt: "desc" } });
  const avg = results.length ? Math.round((results.reduce((s, r) => s + r.score / Math.max(r.maxScore, 1), 0) / results.length) * 100) : null;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={quiz.class?.name ?? "Quiz"} title={quiz.title} actions={<><StartButton body={{ kind: "quiz", quizId: quiz.id }} variant="secondary" size="md">Try it as a student</StartButton><LinkButton href="/teacher/quizzes" variant="ghost">Back</LinkButton></>}>
        {quiz.questions.length} questions · {quiz.mode === "TEST" ? `Test${quiz.timeLimitMin ? `, ${quiz.timeLimitMin} minutes` : ""}` : "Practice"} · {quiz.published ? "Published" : "Not published"}{avg !== null && ` · class average ${avg}%`}
      </PageHeader>
      <Card>
        <h2 className="font-medium">Results ({results.length})</h2>
        {results.length === 0 ? <p className="mt-2 text-sm text-ink-soft">No submissions yet.</p> : (
          <table className="mt-2 w-full text-sm"><thead className="text-left text-xs text-ink-muted"><tr><th className="py-1 font-medium">Student</th><th className="py-1 font-medium">Submitted</th><th className="py-1 text-right font-medium">Score</th></tr></thead>
            <tbody>{results.map((r) => <tr key={r.id} className="border-t border-line"><td className="py-1.5"><a className="hover:underline" href={`/analytics?userId=${r.user.id}`}>{r.user.name}</a></td><td className="py-1.5 text-ink-soft">{r.submittedAt?.toLocaleString("en-GB")}</td><td className="tabular py-1.5 text-right">{Math.round((r.score / Math.max(r.maxScore, 1)) * 100)}%</td></tr>)}</tbody></table>
        )}
      </Card>
      <Card>
        <h2 className="font-medium">Questions</h2>
        <ol className="mt-2 space-y-2">{quiz.questions.map(({ question: q }, i) => (
          <li key={q.id} className="rounded-xl border border-line p-3 text-sm"><span className="flex flex-wrap gap-1.5 text-xs"><span className="tabular font-semibold">{i + 1}.</span><Badge tone="brand">{TYPE_LABEL[q.type]}</Badge><Badge>{BLOOM_LABEL[q.bloom]}</Badge><Badge>{q.outcomeCode}</Badge></span><p className="mt-1">{q.stem}</p></li>
        ))}</ol>
      </Card>
    </div>
  );
}
