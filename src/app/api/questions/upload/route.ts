import { z } from "zod";
import { handler, ok, parseBody, requireUser } from "@/lib/api";
import { questionInputSchema } from "@/lib/questions";
import { csvRowToInput, parseCsv, saveQuestion } from "@/lib/questionIO";

const Body = z.object({
  format: z.enum(["json", "csv"]),
  content: z.string().max(2_000_000),
  status: z.enum(["DRAFT", "APPROVED"]).default("DRAFT"),
});

/** Bulk upload. Every row is validated independently; valid rows are saved, invalid rows are reported. */
export const POST = handler(async (req: Request) => {
  const u = await requireUser({ teacher: true });
  const b = await parseBody(req, Body);
  const rows: unknown[] = b.format === "json" ? z.array(z.unknown()).parse(JSON.parse(b.content)) : parseCsv(b.content);
  const results: { row: number; ok: boolean; id?: string; error?: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    try {
      const q = b.format === "json" ? questionInputSchema.parse(rows[i]) : csvRowToInput(rows[i] as Record<string, string>);
      const saved = await saveQuestion(q, { authorId: u.id, source: "TEACHER", status: b.status });
      results.push({ row: i + 1, ok: true, id: saved.id });
    } catch (e) {
      const msg = e instanceof z.ZodError ? e.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ") : e instanceof Error ? e.message : "invalid";
      results.push({ row: i + 1, ok: false, error: msg.slice(0, 400) });
    }
  }
  return ok({ saved: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
});
