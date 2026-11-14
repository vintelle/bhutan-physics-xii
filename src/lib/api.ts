import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { currentUser, isTeacher } from "./auth";
import type { SessionUser } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function requireUser(opts: { teacher?: boolean } = {}): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in.");
  if (opts.teacher && !isTeacher(user)) throw new HttpError(403, "Teacher access only.");
  return user;
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON.");
  }
  return schema.parse(json);
}

/** Wrap a route handler with uniform error responses: { error, details? }. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      // Let Next.js control-flow signals (dynamic usage, redirect, notFound) propagate untouched.
      if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: unknown }).digest === "string") throw e;
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "Invalid input", details: e.issues }, { status: 422 });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
  };
}
