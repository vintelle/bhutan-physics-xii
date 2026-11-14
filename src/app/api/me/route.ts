import { prisma } from "@/lib/db";
import { handler, ok, requireUser } from "@/lib/api";
import { aiEnabled } from "@/lib/ai/client";

export const GET = handler(async () => {
  const u = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: u.id },
    select: { id: true, name: true, email: true, role: true, school: true, enrollments: { select: { class: { select: { id: true, name: true } } } } },
  });
  return ok({ ...user, aiEnabled: aiEnabled() });
});
