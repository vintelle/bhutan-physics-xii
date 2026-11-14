import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type SessionUser } from "./session";

export async function currentUser(): Promise<SessionUser | null> {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

/** For server components: redirect to login when signed out (or to the right home for the wrong role). */
export async function requirePageUser(roles?: SessionUser["role"][]): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(user.role === "STUDENT" ? "/student" : "/teacher");
  return user;
}

export const isTeacher = (u: SessionUser) => u.role === "TEACHER" || u.role === "ADMIN";
