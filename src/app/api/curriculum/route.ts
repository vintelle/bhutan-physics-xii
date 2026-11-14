import { prisma } from "@/lib/db";
import { handler, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Full hierarchy Theme > Topic > Subtopic > Learning outcome, with approved-item counts per outcome. */
export const GET = handler(async () => {
  const [themes, counts] = await Promise.all([
    prisma.theme.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" }, include: { subtopics: { orderBy: { number: "asc" } }, outcomes: { orderBy: { code: "asc" } } } } },
    }),
    prisma.question.groupBy({ by: ["outcomeCode"], where: { status: "APPROVED" }, _count: { _all: true } }),
  ]);
  const n = new Map(counts.map((c) => [c.outcomeCode, c._count._all]));
  return ok(themes.map((t) => ({ ...t, topics: t.topics.map((tp) => ({ ...tp, outcomes: tp.outcomes.map((o) => ({ ...o, approvedQuestions: n.get(o.code) ?? 0 })) })) })));
});
