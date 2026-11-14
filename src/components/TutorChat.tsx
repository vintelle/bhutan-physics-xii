"use client";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import { api } from "./fetcher";
import { buttonClass, cx } from "./ui";

interface Msg { role: "user" | "assistant"; content: string }
interface SessionRow { id: string; title: string; createdAt: string }

const STARTERS = [
  "Explain simple harmonic motion simply, with an everyday example.",
  "Give me a hint for finding the equivalent capacitance of 2 µF and 3 µF in series.",
  "Why doesn't brighter light increase the kinetic energy of photoelectrons?",
  "How does a potentiometer measure the e.m.f. of a dry cell?",
  "Help me compare nuclear fission and nuclear fusion.",
];

export function TutorChat({ aiEnabled, initialQuestion }: { aiEnabled: boolean; initialQuestion?: string }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(initialQuestion ?? "");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api<SessionRow[]>("/api/tutor").then(setSessions).catch(() => {}); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  async function open(id: string) {
    const s = await api<{ id: string; messages: Msg[] }>(`/api/tutor/${id}`);
    setSessionId(s.id);
    setMessages(s.messages.map((m) => ({ role: m.role, content: m.content })));
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message }) });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "The tutor could not reply.");
      }
      const sid = res.headers.get("X-Session-Id") ?? undefined;
      if (sid && sid !== sessionId) {
        setSessionId(sid);
        setSessions((s) => [{ id: sid, title: message.slice(0, 60), createdAt: new Date().toISOString() }, ...s.filter((x) => x.id !== sid)]);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + chunk }; return c; });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The tutor could not reply.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <aside className="space-y-2">
        <button className={cx(buttonClass("secondary", "sm"), "w-full")} onClick={() => { setSessionId(undefined); setMessages([]); }}>+ New conversation</button>
        <ul className="space-y-1 text-sm">
          {sessions.map((s) => (
            <li key={s.id}>
              <button onClick={() => open(s.id)} className={cx("w-full truncate rounded-lg px-2 py-1.5 text-left hover:bg-surface", s.id === sessionId ? "bg-surface font-medium text-ink" : "text-ink-soft")}>{s.title}</button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-line bg-raised">
        <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
          {!aiEnabled && <p className="rounded-xl border border-warn/30 bg-warn/5 p-3 text-sm">The AI tutor is not configured on this server yet. An administrator needs to set <code>ANTHROPIC_API_KEY</code>.</p>}
          {messages.length === 0 && (
            <div>
              <p className="font-display text-xl font-semibold">Ask anything from Class XII Physics</p>
              <p className="mt-1 text-sm text-ink-soft">The tutor sticks to the national curriculum. It gives a hint first so you can try for yourself, and sets out numericals step by step (Given → Formula → Substitution → Answer).</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-left text-sm text-ink-soft hover:border-brand hover:text-ink">{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cx("max-w-[90%] rounded-2xl px-4 py-3 text-sm", m.role === "user" ? "ml-auto bg-brand text-brand-ink" : "bg-page text-ink")}>
              {m.role === "assistant" ? (m.content ? <Markdown text={m.content} /> : <span className="text-ink-muted">Thinking…</span>) : <p className="whitespace-pre-wrap">{m.content}</p>}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        {error && <p role="alert" className="px-5 text-sm text-bad">{error}</p>}
        <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2} placeholder="Type your physics question…" disabled={!aiEnabled}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
            className="flex-1 resize-none rounded-xl border border-line bg-surface p-2.5 text-sm" />
          <button disabled={!aiEnabled || streaming || !input.trim()} className={buttonClass()}>{streaming ? "…" : "Send"}</button>
        </form>
      </section>
    </div>
  );
}
