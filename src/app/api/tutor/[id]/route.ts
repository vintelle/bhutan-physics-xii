import { prisma } from "@/lib/db";
import { HttpError, handler, ok, requireUser } from "@/lib/api";

export const GET = handler(async (_req: Request, { params }: { params: { id: string } }) => {
  const u = await requireUser();
  const s = await prisma.tutorSession.findFirst({ where: { id: params.id, userId: u.id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!s) throw new HttpError(404, "Conversation not found.");
  return ok(s);
});
