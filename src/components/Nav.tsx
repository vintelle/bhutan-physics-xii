import Link from "next/link";
import { currentUser, isTeacher } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function Nav() {
  const user = await currentUser();
  const links = !user
    ? []
    : isTeacher(user)
      ? [["/teacher", "Dashboard"], ["/teacher/questions", "Question bank"], ["/teacher/quizzes", "Quizzes & tests"], ["/teacher/analytics", "Analytics"], ["/tutor", "AI Tutor"]]
      : [["/student", "Dashboard"], ["/practice", "Practice"], ["/analytics", "My progress"], ["/tutor", "AI Tutor"]];
  return (
    <nav className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href={user ? (isTeacher(user) ? "/teacher" : "/student") : "/"} className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-ink">φ</span>
          XII Physics
        </Link>
        <div className="order-last -mx-1 flex w-full flex-nowrap items-center gap-1 overflow-x-auto text-sm sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:flex-wrap">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-ink-soft hover:bg-page hover:text-ink">{label}</Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm sm:ml-0">
          {user ? (
            <>
              <span className="hidden text-ink-soft sm:inline">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 text-ink-soft hover:text-ink">Sign in</Link>
              <Link href="/register" className="rounded-lg bg-brand px-3 py-1.5 font-medium text-brand-ink hover:bg-brand-strong">Create account</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
