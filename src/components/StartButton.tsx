"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./fetcher";
import { buttonClass, type BtnVariant } from "./ui";

/** Starts an attempt (practice for outcomes, a quiz, or smart review) and opens it. */
export function StartButton({ body, children, variant = "primary", size = "sm" }: { body: unknown; children: React.ReactNode; variant?: BtnVariant; size?: "sm" | "md" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button disabled={busy} className={buttonClass(variant, size)} onClick={async () => {
        setBusy(true); setErr(null);
        try { const a = await api<{ id: string }>("/api/attempts", { json: body }); router.push(`/quiz/${a.id}`); }
        catch (e) { setErr(e instanceof Error ? e.message : "Could not start"); setBusy(false); }
      }}>{busy ? "Starting…" : children}</button>
      {err && <span className="mt-1 text-xs text-bad">{err}</span>}
    </span>
  );
}
