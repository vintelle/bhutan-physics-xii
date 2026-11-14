import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError, handler, ok, parseBody } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

const Body = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export const POST = handler(async (req: Request) => {
  const b = await parseBody(req, Body);
  const user = await prisma.user.findUnique({ where: { email: b.email } });
  if (!user || !(await bcrypt.compare(b.password, user.passwordHash))) throw new HttpError(401, "Email or password is incorrect.");
  cookies().set(SESSION_COOKIE, await signSession({ id: user.id, name: user.name, role: user.role }), sessionCookieOptions());
  return ok({ id: user.id, name: user.name, role: user.role });
});
