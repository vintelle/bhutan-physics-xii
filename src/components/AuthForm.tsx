"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "./fetcher";
import { buttonClass, cx } from "./ui";

const field = "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    setError(null);
    try {
      const body = mode === "login" ? { email: f.email, password: f.password } : { ...f, role, joinCode: f.joinCode || undefined, school: f.school || undefined, teacherCode: f.teacherCode || undefined };
      const u = await api<{ role: string }>(`/api/auth/${mode}`, { json: body });
      router.push(params.get("next") ?? (u.role === "STUDENT" ? "/student" : "/teacher"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-6 max-w-md space-y-4 rounded-2xl border border-line bg-raised p-6">
      <h1 className="font-display text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      {mode === "register" && (
        <>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="I am a">
            {(["STUDENT", "TEACHER"] as const).map((r) => (
              <button type="button" key={r} aria-pressed={role === r} onClick={() => setRole(r)} className={cx("rounded-xl border p-2.5 text-sm font-medium", role === r ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-soft")}>
                {r === "STUDENT" ? "I'm a student" : "I'm a teacher"}
              </button>
            ))}
          </div>
          <label className="block text-sm">Full name<input name="name" required minLength={2} className={field} /></label>
          <label className="block text-sm">School <span className="text-ink-muted">(optional)</span><input name="school" className={field} /></label>
        </>
      )}
      <label className="block text-sm">Email<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="block text-sm">Password<input name="password" type="password" required minLength={mode === "register" ? 8 : 1} autoComplete={mode === "login" ? "current-password" : "new-password"} className={field} /></label>
      {mode === "register" && role === "STUDENT" && <label className="block text-sm">Class join code <span className="text-ink-muted">(from your teacher, optional)</span><input name="joinCode" maxLength={6} className={cx(field, "uppercase tracking-widest")} /></label>}
      {mode === "register" && role === "TEACHER" && <label className="block text-sm">Teacher sign-up code <span className="text-ink-muted">(if your school set one)</span><input name="teacherCode" className={field} /></label>}
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <button disabled={busy} className={cx(buttonClass(), "w-full")}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      <p className="text-center text-sm text-ink-soft">
        {mode === "login" ? <>New here? <Link className="text-brand hover:underline" href="/register">Create an account</Link></> : <>Already registered? <Link className="text-brand hover:underline" href="/login">Sign in</Link></>}
      </p>
    </form>
  );
}
