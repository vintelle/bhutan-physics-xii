import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { classAnalytics } from "@/lib/services/analytics";
import { aiEnabled } from "@/lib/ai/client";
import { Card, LinkButton, PageHeader, StatTile } from "@/components/ui";
import { ClassManager } from "@/components/teacher/ClassManager";
import { TYPE_LABEL } from "@/lib/questions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teacher dashboard" };

export default async function TeacherDashboard() {
  const user = await requirePageUser(["TEACHER", "ADMIN"]);
  const [classes, drafts, approved, byType, quizzes] = await Promise.all([
    prisma.class.findMany({ where: { teacherId: user.id }, include: { _count: { select: { students: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.question.count({ where: { status: "DRAFT" } }),
    prisma.question.count({ where: { status: "APPROVED" } }),
    prisma.question.groupBy({ by: ["type"], where: { status: "APPROVED" }, _count: { _all: true } }),
    prisma.quiz.findMany({ where: { createdById: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { _count: { select: { attempts: true } } } }),
  ]);
  const first = classes[0] ? await classAnalytics(classes[0].id) : null;
  const students = classes.reduce((s, c) => s + c._count.students, 0);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher" title={`Welcome, ${user.name}`} actions={<><LinkButton href="/teacher/quizzes">Generate a test</LinkButton><LinkButton href="/teacher/questions?tab=generate" variant="secondary">Generate questions</LinkButton></>}>
        Manage your question bank, set tests, and see which learning outcomes your class needs support with.
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Students" value={students} sub={`${classes.length} class${classes.length === 1 ? "" : "es"}`} />
        <StatTile label="Approved questions" value={approved} sub="in the shared bank" />
        <StatTile label="Drafts to review" value={drafts} sub={<Link href="/teacher/questions?status=DRAFT" className="text-brand hover:underline">Review now →</Link>} />
        <StatTile label="Outcomes needing intervention" value={first ? first.interventions.length : "-"} sub={first ? first.class.name : "create a class"} />
      </div>
      {!aiEnabled() && <p className="rounded-xl border border-warn/30 bg-warn/5 p-3 text-sm">AI features (question generation, the tutor and AI marking of written answers) are switched off until <code>ANTHROPIC_API_KEY</code> is set on the server. Everything else works; written answers are marked by keyword matching against their key points.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><h2 className="font-medium">Your classes</h2><p className="text-xs text-ink-muted">Share the join code with your students.</p><div className="mt-2"><ClassManager classes={classes.map((c) => ({ id: c.id, name: c.name, joinCode: c.joinCode, students: c._count.students }))} /></div></Card>
        <Card>
          <h2 className="font-medium">Needs intervention{first ? ` · ${first.class.name}` : ""}</h2>
          <p className="text-xs text-ink-muted">Learning outcomes where fewer than half the active students are on track</p>
          {!first || first.interventions.length === 0 ? <p className="mt-3 text-sm text-ink-soft">Nothing flagged yet.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {first.interventions.slice(0, 5).map((o) => (
                <li key={o.code} className="rounded-xl border border-bad/30 bg-bad/5 p-2.5"><span className="font-mono text-xs text-ink-muted">{o.code}</span> {o.statement}<span className="tabular block text-xs text-ink-soft">{o.onTrackShare}% on track · average mastery {o.averageMastery}% · {o.activeStudents} students</span></li>
              ))}
            </ul>
          )}
          {first && <Link href={`/teacher/analytics?classId=${first.class.id}`} className="mt-3 inline-block text-sm text-brand hover:underline">Full class analytics →</Link>}
        </Card>
        <Card>
          <h2 className="font-medium">Question bank by type</h2>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">{byType.map((t) => <li key={t.type} className="flex justify-between rounded-lg bg-page px-3 py-2"><span>{TYPE_LABEL[t.type]}</span><span className="tabular">{t._count._all}</span></li>)}</ul>
        </Card>
        <Card>
          <h2 className="font-medium">Recent quizzes</h2>
          <ul className="mt-2 divide-y divide-line text-sm">{quizzes.map((q) => <li key={q.id} className="flex justify-between py-2"><Link href={`/teacher/quizzes/${q.id}`} className="hover:underline">{q.title}</Link><span className="tabular text-ink-muted">{q.published ? "Published" : "Draft"} · {q._count.attempts} attempts</span></li>)}</ul>
        </Card>
      </div>
    </div>
  );
}
