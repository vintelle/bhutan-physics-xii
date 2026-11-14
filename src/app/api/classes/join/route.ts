import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError, handler, ok, parseBody, requireUser } from "@/lib/api";

export const POST = handler(async (req: Request) => {
  const u = await requireUser();
  const { joinCode } = await parseBody(req, z.object({ joinCode: z.string().trim().toUpperCase().length(6) }));
  const cls = await prisma.class.findUnique({ where: { joinCode } });
  if (!cls) throw new HttpError(404, "No class found with that join code.");
  await prisma.enrollment.upsert({ where: { userId_classId: { userId: u.id, classId: cls.id } }, create: { userId: u.id, classId: cls.id }, update: {} });
  return ok({ id: cls.id, name: cls.name });
});
