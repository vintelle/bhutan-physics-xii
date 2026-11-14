import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePageUser, isTeacher } from "@/lib/auth";
import { studentProgress } from "@/lib/services/analytics";
import { curriculum } from "@/lib/curriculum";
import { Card, PageHeader, StatTile, StateChip } from "@/components/ui";
import { BarList, TrendLine } from "@/components/charts";
import { StartButton } from "@/components/StartButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress & analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: { userId?: string } }) {
  const user = await requirePageUser();
  let targetId = user.id, targetName = "My progress";
  if (searchParams.userId && isTeacher(user)) {
    const link = await prisma.enrollment.findFirst({ where: { userId: searchParams.userId, class: { teacherId: user.id } }, include: { user: true } });
    if (link) { targetId = link.userId; targetName = `${link.user.name}'s progress`; }
  }
  const p = await studentProgress(targetId);
  const own = targetId === user.id;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Analytics" title={targetName}>Mastery is a weighted average of recent results for each learning outcome, with recent answers counting most. An outcome counts as mastered at 80% or above after at least 3 questions.</PageHeader>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Average score" value={p.summary.averagePercent === null ? "-" : `${p.summary.averagePercent}%`} sub={`${p.summary.quizzesTaken} quizzes`} />
        <StatTile label="Mastered" value={`${p.summary.mastered}/${p.summary.totalOutcomes}`} sub="learning outcomes" />
        <StatTile label="Weak" value={p.summary.weak} sub="learning outcomes" />
        <StatTile label="Improvement" value={p.summary.improvement === null ? "-" : `${p.summary.improvement > 0 ? "+" : ""}${p.summary.improvement} pts`} sub="over time" />
      </div>
      <TrendLine title="Improvement over time" subtitle="Score on each completed quiz" points={p.trend.map((t) => ({ key: t.id, label: new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), value: t.percent, detail: t.title }))} />
      <BarList title="Topic mastery" subtitle="Average mastery across the learning outcomes you have started in each topic"
        rows={p.topics.map((t) => ({ key: t.code, label: t.name, sublabel: `${curriculum.themes.find((x) => x.code === t.theme)?.name} · ${t.mastered}/${t.outcomes} mastered`, value: t.score }))} />
      <Card>
        <h2 className="font-medium">Learning outcomes</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-left text-xs text-ink-muted"><tr><th className="py-2 pr-2 font-medium">Outcome</th><th className="py-2 pr-2 font-medium">Status</th><th className="py-2 pr-2 text-right font-medium">Mastery</th><th className="py-2 text-right font-medium">Questions</th>{own && <th />}</tr></thead>
            <tbody>
              {p.outcomes.map((o) => (
                <tr key={o.code} className="border-t border-line align-top">
                  <td className="py-2 pr-2"><span className="font-mono text-xs text-ink-muted">{o.code}</span> {o.statement}</td>
                  <td className="py-2 pr-2"><StateChip state={o.state} /></td>
                  <td className="tabular py-2 pr-2 text-right">{o.attempts ? `${o.score}%` : "-"}</td>
                  <td className="tabular py-2 text-right text-ink-soft">{o.attempts}</td>
                  {own && <td className="py-2 pl-2 text-right"><StartButton body={{ kind: "practice", outcomes: [o.code], count: 5 }} variant="ghost">Practise</StartButton></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {!own && <Link href="/teacher/analytics" className="text-sm text-brand hover:underline">← Back to class analytics</Link>}
    </div>
  );
}
