import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { studentProgress } from "@/lib/services/analytics";
import { topicByCode } from "@/lib/curriculum";
import { Card, EmptyState, LinkButton, PageHeader, StatTile, StateChip } from "@/components/ui";
import { StartButton } from "@/components/StartButton";
import { JoinClass } from "@/components/JoinClass";
import { TrendLine } from "@/components/charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Student dashboard" };

export default async function StudentDashboard() {
  const user = await requirePageUser(["STUDENT"]);
  const [p, inProgress, enrollments] = await Promise.all([
    studentProgress(user.id),
    prisma.attempt.findMany({ where: { userId: user.id, status: "IN_PROGRESS" }, orderBy: { startedAt: "desc" }, take: 3, include: { _count: { select: { items: true } }, items: { where: { answeredAt: { not: null } }, select: { id: true } } } }),
    prisma.enrollment.findMany({ where: { userId: user.id }, include: { class: true } }),
  ]);
  const classIds = enrollments.map((e) => e.classId);
  const quizzes = await prisma.quiz.findMany({
    where: { published: true, classId: { in: classIds } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { _count: { select: { questions: true } }, attempts: { where: { userId: user.id }, orderBy: { startedAt: "desc" }, take: 1 } },
  });
  const s = p.summary;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={enrollments.map((e) => e.class.name).join(" · ") || "Class XII Physics"} title={`Kuzuzangpo, ${user.name.split(" ")[0]}`}
        actions={<><StartButton body={{ kind: "review", count: 10 }} size="md">Smart review</StartButton><LinkButton href="/practice" variant="secondary">Choose topics</LinkButton></>}>
        Pick up where you left off, or let smart review choose questions from your weakest outcomes.
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Average score" value={s.averagePercent === null ? "-" : `${s.averagePercent}%`} sub={`${s.quizzesTaken} completed quiz${s.quizzesTaken === 1 ? "" : "zes"}`} />
        <StatTile label="Outcomes mastered" value={`${s.mastered}/${s.totalOutcomes}`} sub={`${s.started} started`} />
        <StatTile label="Need more work" value={s.weak} sub="learning outcomes" />
        <StatTile label="Improvement" value={s.improvement === null ? "-" : `${s.improvement > 0 ? "+" : ""}${s.improvement} pts`} sub="recent half vs earlier half" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {inProgress.length > 0 && (
            <Card>
              <h2 className="font-medium">Continue</h2>
              <ul className="mt-3 divide-y divide-line">
                {inProgress.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>{a.title}<span className="tabular block text-xs text-ink-muted">{a.items.length}/{a._count.items} answered · {a.mode === "TEST" ? "Test" : "Practice"}</span></span>
                    <LinkButton href={`/quiz/${a.id}`} size="sm">Resume</LinkButton>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <TrendLine title="Quiz scores over time" subtitle="Percentage score on each completed quiz" points={p.trend.slice(-15).map((t) => ({ key: t.id, label: new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), value: t.percent, detail: t.title }))} />
          <Card>
            <h2 className="font-medium">Assigned by your teacher</h2>
            {quizzes.length === 0 ? (
              <div className="mt-3"><EmptyState title="No assigned quizzes yet">{classIds.length ? "Your teacher hasn't published any yet." : "Join your class with the code from your teacher."}</EmptyState></div>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {quizzes.map((q) => {
                  const a = q.attempts[0];
                  return (
                    <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                      <span>{q.title}<span className="block text-xs text-ink-muted">{q._count.questions} questions{q.timeLimitMin ? ` · ${q.timeLimitMin} min` : ""} · {q.mode === "TEST" ? "Test" : "Practice"}</span></span>
                      {a?.status === "SUBMITTED" ? <Link href={`/quiz/${a.id}`} className="tabular text-sm text-brand hover:underline">Review · {Math.round((a.score / Math.max(a.maxScore, 1)) * 100)}%</Link>
                        : a ? <LinkButton href={`/quiz/${a.id}`} size="sm">Resume</LinkButton>
                        : <StartButton body={{ kind: "quiz", quizId: q.id }}>Start</StartButton>}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 border-t border-line pt-4"><JoinClass /></div>
          </Card>
        </div>
        <Card>
          <h2 className="font-medium">Focus areas</h2>
          <p className="text-xs text-ink-muted">Learning outcomes where your mastery is below 50%</p>
          {p.weakOutcomes.length === 0 ? (
            <div className="mt-3"><EmptyState title="No weak outcomes right now">Keep practising new topics to build mastery.</EmptyState></div>
          ) : (
            <ul className="mt-3 space-y-3">
              {p.weakOutcomes.slice(0, 6).map((o) => (
                <li key={o.code} className="rounded-xl border border-line p-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs text-ink-muted">{o.code} · {topicByCode.get(o.topic)?.name}</span><StateChip state={o.state} /></div>
                  <p className="mt-1">{o.statement}</p>
                  <div className="mt-2 flex items-center justify-between"><span className="tabular text-xs text-ink-muted">Mastery {o.score}%</span><StartButton body={{ kind: "practice", outcomes: [o.code], count: 5 }} variant="secondary">Practise 5</StartButton></div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/analytics" className="mt-4 inline-block text-sm text-brand hover:underline">See full progress →</Link>
        </Card>
      </div>
    </div>
  );
}
