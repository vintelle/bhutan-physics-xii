import { prisma } from "@/lib/db";
import { HttpError, handler, ok, requireUser } from "@/lib/api";
import { isTeacher } from "@/lib/auth";
import { studentProgress } from "@/lib/services/analytics";

/** Own progress, or ?userId= for a teacher viewing a student in one of their classes. */
export const GET = handler(async (req: Request) => {
  const u = await requireUser();
  const target = new URL(req.url).searchParams.get("userId") ?? u.id;
  if (target !== u.id) {
    if (!isTeacher(u)) throw new HttpError(403, "Not allowed.");
    const link = await prisma.enrollment.findFirst({ where: { userId: target, class: { teacherId: u.id } } });
    if (!link) throw new HttpError(403, "That student is not in your classes.");
  }
  return ok(await studentProgress(target));
});
