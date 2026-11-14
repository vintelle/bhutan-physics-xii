import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { classAnalytics } from "@/lib/services/analytics";
import { curriculum, topicByCode } from "@/lib/curriculum";
import { TYPE_LABEL } from "@/lib/questions";
import { Card, EmptyState, PageHeader, StatTile } from "@/components/ui";
import { BarList, TrendLine } from "@/components/charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Class analytics" };

export default async function ClassAnalyticsPage({ searchParams }: { searchParams: { classId?: string } }) {
  const user = await requirePageUser(["TEACHER", "ADMIN"]);
  const classes = await prisma.class.findMany({ where: { teacherId: user.id }, orderBy: { createdAt: "asc" } });
  if (classes.length === 0) return (<><PageHeader eyebrow="Teacher" title="Class analytics" /><EmptyState title="Create a class first">Go to the dashboard, create a class and share its join code with your students.</EmptyState></>);
  const cls = classes.find((c) => c.id === searchParams.classId) ?? classes[0];
  const a = (await classAnalytics(cls.id))!;
  const active = a.students.filter((s) => s.quizzes > 0);
  const avg = active.length ? Math.round(active.reduce((s, x) => s + (x.averagePercent ?? 0), 0) / active.length) : null;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Teacher · Analytics" title={a.class.name}
        actions={classes.length > 1 ? <nav className="flex flex-wrap gap-1 text-sm">{classes.map((c) => <Link key={c.id} href={`/teacher/analytics?classId=${c.id}`} className={`rounded-lg px-3 py-1.5 ${c.id === cls.id ? "bg-brand text-brand-ink" : "border border-line"}`}>{c.name}</Link>)}</nav> : undefined}>
        Join code <span className="font-mono tracking-widest">{a.class.joinCode}</span> · {a.class.students} students
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Class average" value={avg === null ? "-" : `${avg}%`} sub="across completed quizzes" />
        <StatTile label="Active students" value={`${active.length}/${a.class.students}`} />
        <StatTile label="Outcomes needing intervention" value={a.interventions.length} sub="fewer than half on track" />
        <StatTile label="Outcomes with activity" value={`${a.outcomes.filter((o) => o.activeStudents > 0).length}/${curriculum.learning_objectives.length}`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendLine title="Class performance trend" subtitle="Average quiz score per week" points={a.trend.map((t) => ({ key: t.week, label: new Date(t.week).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), value: t.percent, detail: `${t.attempts} quizzes completed (week of ${t.week})` }))} />
        <BarList title="Topic mastery" subtitle="Average student mastery per topic (IG Annexure 2 weighting shown)" rows={a.topics.map((t) => ({ key: t.code, label: t.name, sublabel: `${t.weighting}% of Class XII`, value: t.averageMastery }))} />
      </div>
      <Card>
        <h2 className="font-medium">Learning outcomes requiring intervention</h2>
        <p className="text-xs text-ink-muted">Flagged when fewer than 50% of the students who attempted the outcome are on track (mastery 60% or above)</p>
        {a.interventions.length === 0 ? <p className="mt-3 text-sm text-ink-soft">None flagged - well done.</p> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[42rem] text-sm">
            <thead className="text-left text-xs text-ink-muted"><tr><th className="py-1 font-medium">Outcome</th><th className="py-1 text-right font-medium">On track</th><th className="py-1 text-right font-medium">Avg mastery</th><th className="py-1 pl-3 font-medium">Students needing work</th></tr></thead>
            <tbody>{a.interventions.map((o) => (
              <tr key={o.code} className="border-t border-line align-top">
                <td className="py-2 pr-2"><span className="mr-1 text-bad" aria-hidden>!</span><span className="font-mono text-xs text-ink-muted">{o.code} · {topicByCode.get(o.topic)?.name}</span><span className="block">{o.statement}</span></td>
                <td className="tabular py-2 text-right">{o.onTrackShare}%</td><td className="tabular py-2 text-right">{o.averageMastery}%</td>
                <td className="py-2 pl-3 text-ink-soft">{o.struggling.join(", ") || "-"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      <Card>
        <h2 className="font-medium">Most-missed concepts</h2>
        <p className="text-xs text-ink-muted">Questions with the highest error rate (at least 3 responses) and the misconception behind them</p>
        {a.mostMissed.length === 0 ? <p className="mt-3 text-sm text-ink-soft">Not enough responses yet.</p> : (
          <ul className="mt-3 space-y-3">{a.mostMissed.map((m) => (
            <li key={m.questionId} className="rounded-xl border border-line p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-ink-muted"><span className="font-mono">{m.outcomeCode} · {m.subtopic} · {TYPE_LABEL[m.type]}</span><span className="tabular font-semibold text-bad">{m.errorRate}% wrong · {m.responses} responses</span></div>
              <p className="mt-1">{m.stem}</p>
              <p className="mt-1 text-ink-soft"><b>Likely misconception:</b> {m.misconception}</p>
            </li>
          ))}</ul>
        )}
      </Card>
      <Card>
        <h2 className="font-medium">Students</h2>
        <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[32rem] text-sm">
          <thead className="text-left text-xs text-ink-muted"><tr><th className="py-1 font-medium">Name</th><th className="py-1 text-right font-medium">Quizzes</th><th className="py-1 text-right font-medium">Average</th><th className="py-1 text-right font-medium">Mastered</th><th className="py-1 text-right font-medium">Weak</th></tr></thead>
          <tbody>{a.students.map((s) => (
            <tr key={s.id} className="border-t border-line"><td className="py-1.5"><Link href={`/analytics?userId=${s.id}`} className="hover:underline">{s.name}</Link></td><td className="tabular py-1.5 text-right">{s.quizzes}</td><td className="tabular py-1.5 text-right">{s.averagePercent === null ? "-" : `${s.averagePercent}%`}</td><td className="tabular py-1.5 text-right">{s.mastered}</td><td className="tabular py-1.5 text-right">{s.weak}</td></tr>
          ))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
