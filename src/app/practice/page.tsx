import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { masteryState } from "@/lib/mastery";
import { PageHeader } from "@/components/ui";
import { PracticePicker, type PickerTheme } from "@/components/PracticePicker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Topic practice" };

export default async function PracticePage({ searchParams }: { searchParams: { outcome?: string } }) {
  const user = await requirePageUser();
  const [themes, counts, mastery] = await Promise.all([
    prisma.theme.findMany({ orderBy: { order: "asc" }, include: { topics: { orderBy: { order: "asc" }, include: { subtopics: { orderBy: { number: "asc" } }, outcomes: { orderBy: { code: "asc" } } } } } }),
    prisma.question.groupBy({ by: ["outcomeCode"], where: { status: "APPROVED" }, _count: { _all: true } }),
    prisma.mastery.findMany({ where: { userId: user.id } }),
  ]);
  const n = new Map(counts.map((c) => [c.outcomeCode, c._count._all]));
  const m = new Map(mastery.map((x) => [x.outcomeCode, x]));
  const data: PickerTheme[] = themes.map((t) => ({
    code: t.code, name: t.name, weighting: t.weighting,
    topics: t.topics.map((tp) => ({
      code: tp.code, name: tp.name, weighting: tp.weighting,
      subtopics: tp.subtopics.map((s) => ({ number: s.number, title: s.title })),
      outcomes: tp.outcomes.map((o) => ({ code: o.code, roman: o.roman, statement: o.statement, approvedQuestions: n.get(o.code) ?? 0, state: masteryState(m.get(o.code)?.score ?? 0, m.get(o.code)?.attempts ?? 0), score: Math.round((m.get(o.code)?.score ?? 0) * 100) })),
    })),
  }));
  return (
    <>
      <PageHeader eyebrow="Topic practice" title="Choose what to practise">
        Pick whole themes, topics, or individual learning outcomes. Questions you have not seen, or got wrong before, come first.
      </PageHeader>
      <PracticePicker themes={data} initialOutcome={searchParams.outcome} />
    </>
  );
}
