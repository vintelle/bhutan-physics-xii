import { prisma } from "../db";
import { curriculum } from "../curriculum";
import { INTERVENTION_ON_TRACK_SHARE, masteryState, type MasteryState } from "../mastery";

const pct = (x: number) => Math.round(x * 100);

/** ISO week start (Monday) for grouping trends. */
function weekStart(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - day);
  return x.toISOString().slice(0, 10);
}

export async function studentProgress(userId: string) {
  const [mastery, attempts] = await Promise.all([
    prisma.mastery.findMany({ where: { userId } }),
    prisma.attempt.findMany({ where: { userId, status: "SUBMITTED", maxScore: { gt: 0 } }, orderBy: { submittedAt: "asc" }, select: { id: true, title: true, mode: true, score: true, maxScore: true, submittedAt: true } }),
  ]);
  const mByCode = new Map(mastery.map((m) => [m.outcomeCode, m]));
  const outcomes = curriculum.learning_objectives.map((o) => {
    const m = mByCode.get(o.code);
    const state: MasteryState = masteryState(m?.score ?? 0, m?.attempts ?? 0);
    return { code: o.code, statement: o.statement, theme: o.theme, topic: o.topic, score: pct(m?.score ?? 0), attempts: m?.attempts ?? 0, state };
  });
  const topics = curriculum.topics.map((t) => {
    const os = outcomes.filter((o) => o.topic === t.code);
    const started = os.filter((o) => o.attempts > 0);
    return {
      code: t.code,
      name: t.name,
      theme: t.theme,
      outcomes: os.length,
      mastered: os.filter((o) => o.state === "mastered").length,
      weak: os.filter((o) => o.state === "weak").length,
      score: started.length ? Math.round(started.reduce((s, o) => s + o.score, 0) / started.length) : null,
    };
  });
  const trend = attempts.map((a) => ({ id: a.id, title: a.title, mode: a.mode, date: a.submittedAt!.toISOString(), percent: pct(a.score / a.maxScore) }));
  const half = Math.floor(trend.length / 2);
  const avg = (xs: { percent: number }[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x.percent, 0) / xs.length) : null);
  return {
    summary: {
      quizzesTaken: attempts.length,
      averagePercent: avg(trend),
      mastered: outcomes.filter((o) => o.state === "mastered").length,
      weak: outcomes.filter((o) => o.state === "weak").length,
      started: outcomes.filter((o) => o.attempts > 0).length,
      totalOutcomes: outcomes.length,
      improvement: trend.length >= 4 ? (avg(trend.slice(half)) ?? 0) - (avg(trend.slice(0, half)) ?? 0) : null,
    },
    outcomes,
    topics,
    trend,
    weakOutcomes: outcomes.filter((o) => o.state === "weak").sort((a, b) => a.score - b.score),
  };
}

export async function classAnalytics(classId: string) {
  const cls = await prisma.class.findUnique({ where: { id: classId }, include: { students: { include: { user: { select: { id: true, name: true } } } } } });
  if (!cls) return null;
  const studentIds = cls.students.map((s) => s.userId);
  const [mastery, attempts, items] = await Promise.all([
    prisma.mastery.findMany({ where: { userId: { in: studentIds } } }),
    prisma.attempt.findMany({ where: { userId: { in: studentIds }, status: "SUBMITTED", maxScore: { gt: 0 } }, select: { userId: true, score: true, maxScore: true, submittedAt: true } }),
    prisma.attemptItem.findMany({
      where: { attempt: { userId: { in: studentIds } }, answeredAt: { not: null } },
      select: { isCorrect: true, question: { select: { id: true, stem: true, type: true, outcomeCode: true, subtopicNumber: true, misconception: true } } },
    }),
  ]);

  // Learning outcomes: average mastery and the share of active students on track.
  const outcomes = curriculum.learning_objectives.map((o) => {
    const ms = mastery.filter((m) => m.outcomeCode === o.code && m.attempts > 0);
    const onTrack = ms.filter((m) => ["mastered", "learning"].includes(masteryState(m.score, m.attempts)) && m.score >= 0.6).length;
    const avg = ms.length ? ms.reduce((s, m) => s + m.score, 0) / ms.length : 0;
    return {
      code: o.code,
      statement: o.statement,
      topic: o.topic,
      activeStudents: ms.length,
      averageMastery: ms.length ? pct(avg) : null,
      onTrackShare: ms.length ? pct(onTrack / ms.length) : null,
      mastered: ms.filter((m) => masteryState(m.score, m.attempts) === "mastered").length,
      struggling: ms.filter((m) => masteryState(m.score, m.attempts) === "weak").map((m) => cls.students.find((s) => s.userId === m.userId)?.user.name ?? "?"),
      needsIntervention: ms.length > 0 && onTrack / ms.length < INTERVENTION_ON_TRACK_SHARE,
    };
  });

  const topics = curriculum.topics.map((t) => {
    const os = outcomes.filter((o) => o.topic === t.code && o.averageMastery !== null);
    return { code: t.code, name: t.name, theme: t.theme, weighting: t.weighting, averageMastery: os.length ? Math.round(os.reduce((s, o) => s + (o.averageMastery ?? 0), 0) / os.length) : null };
  });

  // Most-missed concepts: items with the highest error rate (at least 3 responses).
  const byQ = new Map<string, { q: (typeof items)[number]["question"]; n: number; wrong: number }>();
  for (const it of items) {
    const e = byQ.get(it.question.id) ?? { q: it.question, n: 0, wrong: 0 };
    e.n++;
    if (!it.isCorrect) e.wrong++;
    byQ.set(it.question.id, e);
  }
  const mostMissed = [...byQ.values()]
    .filter((e) => e.n >= 3)
    .map((e) => ({ questionId: e.q.id, stem: e.q.stem, type: e.q.type, outcomeCode: e.q.outcomeCode, subtopic: e.q.subtopicNumber, misconception: e.q.misconception, responses: e.n, errorRate: pct(e.wrong / e.n) }))
    .sort((a, b) => b.errorRate - a.errorRate || b.responses - a.responses)
    .slice(0, 10);

  // Weekly class performance trend.
  const weeks = new Map<string, { sum: number; n: number }>();
  for (const a of attempts) {
    const w = weekStart(a.submittedAt!);
    const e = weeks.get(w) ?? { sum: 0, n: 0 };
    e.sum += a.score / a.maxScore;
    e.n++;
    weeks.set(w, e);
  }
  const trend = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([week, e]) => ({ week, percent: pct(e.sum / e.n), attempts: e.n }));

  const students = cls.students.map((s) => {
    const ms = mastery.filter((m) => m.userId === s.userId);
    const at = attempts.filter((a) => a.userId === s.userId);
    return {
      id: s.userId,
      name: s.user.name,
      quizzes: at.length,
      averagePercent: at.length ? pct(at.reduce((x, a) => x + a.score / a.maxScore, 0) / at.length) : null,
      mastered: ms.filter((m) => masteryState(m.score, m.attempts) === "mastered").length,
      weak: ms.filter((m) => masteryState(m.score, m.attempts) === "weak").length,
    };
  });

  return {
    class: { id: cls.id, name: cls.name, joinCode: cls.joinCode, students: cls.students.length },
    topics,
    outcomes,
    interventions: outcomes.filter((o) => o.needsIntervention).sort((a, b) => (a.onTrackShare ?? 0) - (b.onTrackShare ?? 0)),
    mostMissed,
    trend,
    students: students.sort((a, b) => (a.averagePercent ?? -1) - (b.averagePercent ?? -1)),
  };
}
