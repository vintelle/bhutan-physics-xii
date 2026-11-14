"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./fetcher";
import { buttonClass } from "./ui";

export function JoinClass() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
      e.preventDefault();
      try { const c = await api<{ name: string }>("/api/classes/join", { json: { joinCode: code } }); setMsg(`Joined ${c.name}`); setCode(""); router.refresh(); }
      catch (err) { setMsg(err instanceof Error ? err.message : "Could not join"); }
    }}>
      <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="JOIN CODE" aria-label="Class join code" className="w-32 rounded-xl border border-line bg-surface px-3 py-2 text-sm uppercase tracking-widest" />
      <button disabled={code.length !== 6} className={buttonClass("secondary", "sm")}>Join class</button>
      {msg && <p className="w-full text-xs text-ink-soft">{msg}</p>}
    </form>
  );
}
