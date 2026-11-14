import { prisma } from "@/lib/db";
import { handler, ok, requireUser } from "@/lib/api";
import { outcomeByCode } from "@/lib/curriculum";

/** Verbatim Instructional Guide questions, by ?subtopic=3.4.3, ?outcome=XII.EM.11 or ?theme=EM */
export const GET = handler(async (req: Request) => {
  await requireUser({ teacher: true });
  const p = new URL(req.url).searchParams;
  const subs = p.get("outcome") ? outcomeByCode.get(p.get("outcome")!)?.subtopics ?? [] : p.get("subtopic") ? [p.get("subtopic")!] : undefined;
  return ok(await prisma.igExemplar.findMany({
    where: { ...(subs ? { subtopicNumber: { in: subs } } : {}), ...(p.get("theme") ? { themeCode: p.get("theme")! } : {}) },
    orderBy: [{ themeCode: "asc" }, { id: "asc" }],
  }));
});
