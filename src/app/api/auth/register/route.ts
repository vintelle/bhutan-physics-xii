import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError, handler, ok, parseBody } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

const Body = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["STUDENT", "TEACHER"]).default("STUDENT"),
  school: z.string().trim().max(120).optional(),
  joinCode: z.string().trim().toUpperCase().optional(),
  teacherCode: z.string().optional(),
});

export const POST = handler(async (req: Request) => {
  const b = await parseBody(req, Body);
  if (b.role === "TEACHER" && process.env.TEACHER_SIGNUP_CODE && b.teacherCode !== process.env.TEACHER_SIGNUP_CODE)
    throw new HttpError(403, "A valid teacher sign-up code is required. Ask your school's platform administrator.");
  if (await prisma.user.findUnique({ where: { email: b.email } })) throw new HttpError(409, "An account with that email already exists.");
  const cls = b.joinCode ? await prisma.class.findUnique({ where: { joinCode: b.joinCode } }) : null;
  if (b.joinCode && !cls) throw new HttpError(404, "No class found with that join code.");
  const user = await prisma.user.create({
    data: {
      name: b.name, email: b.email, role: b.role, school: b.school,
      passwordHash: await bcrypt.hash(b.password, 10),
      ...(cls && b.role === "STUDENT" ? { enrollments: { create: { classId: cls.id } } } : {}),
    },
  });
  cookies().set(SESSION_COOKIE, await signSession({ id: user.id, name: user.name, role: user.role }), sessionCookieOptions());
  return ok({ id: user.id, name: user.name, role: user.role }, 201);
});
