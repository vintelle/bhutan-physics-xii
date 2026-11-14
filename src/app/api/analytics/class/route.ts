import { prisma } from "@/lib/db";
import { HttpError, handler, ok, requireUser } from "@/lib/api";
import { classAnalytics } from "@/lib/services/analytics";

export const GET = handler(async (req: Request) => {
  const u = await requireUser({ teacher: true });
  const classId = new URL(req.url).searchParams.get("classId");
  if (!classId) throw new HttpError(400, "classId is required.");
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls || (cls.teacherId !== u.id && u.role !== "ADMIN")) throw new HttpError(404, "Class not found.");
  return ok(await classAnalytics(classId));
});
