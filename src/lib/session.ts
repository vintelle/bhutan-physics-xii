import { SignJWT, jwtVerify } from "jose";

/** Edge-safe session helpers (used by middleware and server code). */
export const SESSION_COOKIE = "pq_session";
export type Role = "STUDENT" | "TEACHER" | "ADMIN";
export interface SessionUser {
  id: string;
  name: string;
  role: Role;
}

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { id: payload.sub as string, name: payload.name as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** Cookie options. Secure by default in production; set COOKIE_SECURE=false only for plain-HTTP deployments (e.g. a school LAN without TLS). */
export function sessionCookieOptions() {
  const secure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production";
  return { httpOnly: true, sameSite: "lax" as const, secure, path: "/", maxAge: 60 * 60 * 24 * 14 };
}
