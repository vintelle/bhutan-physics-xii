import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, isTeacher } from "@/lib/auth";
import { curriculum } from "@/lib/curriculum";
import { buttonClass } from "@/components/ui";

export default async function Landing() {
  const user = await currentUser();
  if (user) redirect(isTeacher(user) ? "/teacher" : "/student");
  const features = [
    ["Curriculum-aligned question bank", `All ${curriculum.learning_objectives.length} Class XII learning outcomes, organised by theme, topic and sub-topic exactly as in the Science Curriculum Framework and the Physics Instructional Guide.`],
    ["Seven question types", "Multiple choice, true/false, fill in the blanks, matching, numerical problems, assertion & reason, and written conceptual answers - written at Remembering through Evaluating."],
    ["Feedback that teaches", "Every question has a worked answer, a detailed explanation, the common misconception, and three graduated hints you can open one at a time."],
    ["Progress you can see", "Mastery for each learning outcome, your weak topics, and how your scores improve over time."],
    ["AI tutor", "Ask any Class XII Physics question. The tutor gives a hint first, explains simply and sets out numericals step by step."],
    ["Built for teachers", "Upload or generate questions, build weighted tests in seconds, and see which outcomes your class needs help with."],
  ];
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">National School Curriculum · Class XII</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">Master Grade XII Physics, one learning outcome at a time.</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">Practise with questions built from Bhutan&apos;s Science Curriculum Framework and Physics Instructional Guide, get feedback on every answer, and watch your mastery grow.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className={buttonClass()}>Start practising - it&apos;s free</Link>
            <Link href="/login" className={buttonClass("secondary")}>Sign in</Link>
          </div>
          {process.env.SEED_DEMO === "true" && (
            <p className="mt-3 text-sm text-ink-muted">Try the demo: <span className="font-mono">karma@demo.bt</span> (student) or <span className="font-mono">teacher@demo.bt</span> (teacher), password <span className="font-mono">physics123</span>.</p>
          )}
          <p className="mt-3 text-sm text-ink-muted">Students: create an account and enter the class join code from your physics teacher.</p>
        </div>
        <div className="rounded-2xl border border-line bg-raised p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Class XII themes and exam weighting</p>
          <ul className="mt-3 space-y-3">
            {curriculum.themes.map((t) => (
              <li key={t.code}>
                <div className="flex justify-between text-sm"><span className="font-medium">{t.name}</span><span className="tabular text-ink-soft">{t.weighting}%</span></div>
                <div className="mt-1 h-2 rounded-r-[4px] bg-brand/80" style={{ width: `${(t.weighting / 29) * 100}%` }} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-muted">Weighting from IG Annexure 2 (7,200 minutes of instruction).</p>
        </div>
      </section>
      <section>
        <h2 className="font-display text-2xl font-semibold">Everything a Class XII learner needs</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-raised p-5">
              <p className="font-medium">{t}</p>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-brand-soft p-6">
        <p className="font-display text-xl font-semibold">Strictly aligned with the curriculum</p>
        <p className="mt-2 max-w-3xl text-sm text-ink-soft">Content is taken only from the {curriculum.meta.sources.map((s) => s.title).join(" and the ")}. Topics outside Class XII are not assessed, and the AI tutor redirects off-syllabus questions. Teachers review every AI-generated question before students see it.</p>
      </section>
    </div>
  );
}
