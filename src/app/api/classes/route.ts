import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, ok, parseBody, requireUser } from "@/lib/api";
import { isTeacher } from "@/lib/auth";

const code = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

export const GET = handler(async () => {
  const u = await requireUser();
  if (isTeacher(u))
    return ok(await prisma.class.findMany({ where: { teacherId: u.id }, include: { _count: { select: { students: true } } }, orderBy: { createdAt: "asc" } }));
  return ok((await prisma.enrollment.findMany({ where: { userId: u.id }, include: { class: true } })).map((e) => e.class));
});

export const POST = handler(async (req: Request) => {
  const u = await requireUser({ teacher: true });
  const { name } = await parseBody(req, z.object({ name: z.string().trim().min(2).max(60) }));
  return ok(await prisma.class.create({ data: { name, teacherId: u.id, joinCode: code() } }), 201);
});
