"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../fetcher";
import { buttonClass } from "../ui";

export function ClassManager({ classes }: { classes: { id: string; name: string; joinCode: string; students: number }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <ul className="divide-y divide-line">
        {classes.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
            <span><span className="font-medium">{c.name}</span><span className="tabular block text-xs text-ink-muted">{c.students} student{c.students === 1 ? "" : "s"}</span></span>
            <span className="flex items-center gap-3"><span className="rounded-lg bg-page px-2 py-1 font-mono text-sm tracking-widest" title="Students enter this code to join">{c.joinCode}</span><Link href={`/teacher/analytics?classId=${c.id}`} className="text-brand hover:underline">Analytics</Link></span>
          </li>
        ))}
      </ul>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); setErr(null); try { await api("/api/classes", { json: { name } }); setName(""); router.refresh(); } catch (x) { setErr(x instanceof Error ? x.message : "Could not create class"); } }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New class, e.g. XII Science B" aria-label="New class name" className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm" />
        <button disabled={name.trim().length < 2} className={buttonClass("secondary", "sm")}>Create class</button>
      </form>
      {err && <p className="mt-1 text-xs text-bad">{err}</p>}
    </div>
  );
}
