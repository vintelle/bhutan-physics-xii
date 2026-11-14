import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const STUDENT_AREAS = ["/student", "/practice", "/quiz", "/analytics", "/tutor"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const needsAuth = pathname.startsWith("/teacher") || STUDENT_AREAS.some((p) => pathname.startsWith(p));
  if (needsAuth && !user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/teacher") && user?.role === "STUDENT") return NextResponse.redirect(new URL("/student", req.url));
  if ((pathname === "/login" || pathname === "/register") && user)
    return NextResponse.redirect(new URL(user.role === "STUDENT" ? "/student" : "/teacher", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/student/:path*", "/practice/:path*", "/quiz/:path*", "/analytics/:path*", "/tutor/:path*", "/teacher/:path*", "/login", "/register"] };
