"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../fetcher";
import { Badge, EmptyState, buttonClass } from "../ui";

export interface QuizRow { id: string; title: string; mode: string; published: boolean; timeLimitMin: number | null; className: string | null; questions: number; attempts: number; createdAt: string }

export function QuizList({ quizzes }: { quizzes: QuizRow[] }) {
  const router = useRouter();
  if (quizzes.length === 0) return <EmptyState title="No quizzes yet">Generate a test above, or select questions in the question bank.</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {quizzes.map((q) => (
        <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <div>
            <Link href={`/teacher/quizzes/${q.id}`} className="font-medium hover:underline">{q.title}</Link>
            <p className="text-xs text-ink-muted">{q.questions} questions · {q.mode === "TEST" ? `Test${q.timeLimitMin ? `, ${q.timeLimitMin} min` : ""}` : "Practice"} · {q.className ?? "No class"} · {q.attempts} attempt{q.attempts === 1 ? "" : "s"}</p>
          </div>
          <div className="flex items-center gap-2">
            {q.published ? <Badge tone="good">✓ Published</Badge> : <Badge>Draft</Badge>}
            <button className={buttonClass("secondary", "sm")} onClick={async () => { await api(`/api/quizzes/${q.id}`, { method: "PATCH", json: { published: !q.published } }); router.refresh(); }}>{q.published ? "Unpublish" : "Publish"}</button>
            <button className={buttonClass("ghost", "sm")} onClick={async () => { if (confirm(`Delete "${q.title}"? Student attempts are kept.`)) { await api(`/api/quizzes/${q.id}`, { method: "DELETE" }); router.refresh(); } }}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
