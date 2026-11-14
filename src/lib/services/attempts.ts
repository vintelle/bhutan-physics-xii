import type { Prisma, Question } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../api";
import { applyHintPenalty, gradeObjective, type GradeResult } from "../grading";
import { gradeConceptual } from "../ai/grade";
import { nextMasteryScore } from "../mastery";
import { publicPayload, responseSchemas, type QuestionType } from "../questions";
import type { SessionUser } from "../session";

export interface PracticeSpec {
  outcomes: string[];
  count: number;
  types?: QuestionType[];
  blooms?: string[];
}

/** Topic practice: pick approved items for the chosen outcomes, favouring what the learner has not seen or got wrong. */
export async function startPractice(user: SessionUser, spec: PracticeSpec, title: string) {
  const pool = await prisma.question.findMany({
    where: {
      status: "APPROVED",
      outcomeCode: { in: spec.outcomes },
      ...(spec.types?.length ? { type: { in: spec.types } } : {}),
      ...(spec.blooms?.length ? { bloom: { in: spec.blooms as Question["bloom"][] } } : {}),
    },
    select: { id: true, outcomeCode: true, bloom: true, difficulty: true },
  });
  if (pool.length === 0) throw new HttpError(404, "No approved questions for that selection yet - ask your teacher to add some.");
  const history = await prisma.attemptItem.findMany({
    where: { attempt: { userId: user.id }, questionId: { in: pool.map((q) => q.id) }, answeredAt: { not: null } },
    select: { questionId: true, isCorrect: true },
  });
  const seen = new Map<string, { n: number; wrong: number }>();
  for (const h of history) {
    const s = seen.get(h.questionId) ?? { n: 0, wrong: 0 };
    s.n++;
    if (!h.isCorrect) s.wrong++;
    seen.set(h.questionId, s);
  }
  const mastery = await prisma.mastery.findMany({ where: { userId: user.id, outcomeCode: { in: spec.outcomes } } });
  const mScore = new Map(mastery.map((m) => [m.outcomeCode, m.score]));
  const ranked = pool
    .map((q) => {
      const s = seen.get(q.id);
      const priority =
        (s ? (s.wrong > 0 ? 1 : 3) : 0) + // unseen first, then previously wrong, then previously right
        (mScore.get(q.outcomeCode) ?? 0) + // weaker outcomes earlier
        Math.random() * 0.8;
      return { ...q, priority };
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, spec.count);
  // Ramp from lower to higher demand within the set.
  const order = ["REMEMBERING", "UNDERSTANDING", "APPLYING", "ANALYSING", "EVALUATING", "CREATING"];
  ranked.sort((a, b) => order.indexOf(a.bloom) - order.indexOf(b.bloom) || a.difficulty - b.difficulty);
  return prisma.attempt.create({
    data: {
      userId: user.id,
      mode: "PRACTICE",
      title,
      scope: { outcomes: spec.outcomes } as Prisma.InputJsonValue,
      items: { create: ranked.map((q, i) => ({ questionId: q.id, order: i })) },
    },
  });
}

export async function startQuiz(user: SessionUser, quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!quiz) throw new HttpError(404, "Quiz not found.");
  if (user.role === "STUDENT") {
    if (!quiz.published) throw new HttpError(403, "This quiz is not published yet.");
    if (quiz.classId) {
      const enrolled = await prisma.enrollment.findUnique({ where: { userId_classId: { userId: user.id, classId: quiz.classId } } });
      if (!enrolled) throw new HttpError(403, "This quiz is assigned to another class.");
    }
    const existing = await prisma.attempt.findFirst({ where: { userId: user.id, quizId, status: "IN_PROGRESS" } });
    if (existing) return existing;
  }
  return prisma.attempt.create({
    data: {
      userId: user.id,
      quizId,
      mode: quiz.mode,
      title: quiz.title,
      scope: {} as Prisma.InputJsonValue,
      items: { create: quiz.questions.map((qq, i) => ({ questionId: qq.questionId, order: i })) },
    },
  });
}

async function loadOwnAttempt(user: SessionUser, attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { items: { orderBy: { order: "asc" }, include: { question: true } }, quiz: { select: { timeLimitMin: true } } },
  });
  if (!attempt) throw new HttpError(404, "Attempt not found.");
  if (attempt.userId !== user.id && user.role === "STUDENT") throw new HttpError(403, "Not your attempt.");
  return attempt;
}

type ItemWithQ = Awaited<ReturnType<typeof loadOwnAttempt>>["items"][number];

function feedbackFor(item: ItemWithQ) {
  const q = item.question;
  return {
    isCorrect: item.isCorrect,
    credit: item.credit,
    marksAwarded: item.marksAwarded,
    answer: q.answer,
    explanation: q.explanation,
    misconception: q.misconception,
    solutionSteps: q.solutionSteps,
    hints: q.hints,
    keyPoints: q.type === "CONCEPTUAL" ? (q.payload as { keyPoints?: string[] }).keyPoints ?? [] : undefined,
    aiFeedback: item.aiFeedback,
  };
}

/** Client view: answers and explanations only once the learner is allowed to see them. */
export async function attemptView(user: SessionUser, attemptId: string) {
  const a = await loadOwnAttempt(user, attemptId);
  const reveal = (it: ItemWithQ) => a.status === "SUBMITTED" || (a.mode === "PRACTICE" && it.answeredAt !== null);
  return {
    id: a.id,
    title: a.title,
    mode: a.mode,
    status: a.status,
    score: a.score,
    maxScore: a.maxScore,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    timeLimitMin: a.quiz?.timeLimitMin ?? null,
    items: a.items.map((it) => ({
      id: it.id,
      order: it.order,
      type: it.question.type,
      bloom: it.question.bloom,
      marks: it.question.marks,
      outcomeCode: it.question.outcomeCode,
      stem: it.question.stem,
      payload: publicPayload(it.question.type, it.question.payload),
      response: it.response,
      answered: it.answeredAt !== null,
      hintsUsed: it.hintsUsed,
      hintsShown: a.mode === "PRACTICE" ? it.question.hints.slice(0, it.hintsUsed) : [],
      feedback: reveal(it) ? feedbackFor(it) : null,
    })),
  };
}

export async function revealHint(user: SessionUser, attemptId: string, itemId: string) {
  const a = await loadOwnAttempt(user, attemptId);
  if (a.mode !== "PRACTICE") throw new HttpError(400, "Hints are not available in tests.");
  const it = a.items.find((i) => i.id === itemId);
  if (!it) throw new HttpError(404, "Item not found.");
  if (it.answeredAt) throw new HttpError(400, "You have already answered this question.");
  if (it.hintsUsed >= it.question.hints.length) return { hintsShown: it.question.hints, hintsUsed: it.hintsUsed };
  const updated = await prisma.attemptItem.update({ where: { id: it.id }, data: { hintsUsed: { increment: 1 } } });
  return { hintsShown: it.question.hints.slice(0, updated.hintsUsed), hintsUsed: updated.hintsUsed };
}

async function grade(q: Question, response: unknown): Promise<GradeResult & { feedback?: string }> {
  const type = q.type as QuestionType;
  const parsed = responseSchemas[type].safeParse(response);
  if (!parsed.success) throw new HttpError(422, "That answer is not in the expected format.");
  if (type === "CONCEPTUAL") {
    const p = q.payload as { keyPoints: string[] };
    const a = q.answer as { modelAnswer: string };
    return gradeConceptual({ stem: q.stem, keyPoints: p.keyPoints, modelAnswer: a.modelAnswer }, (parsed.data as { text: string }).text);
  }
  return gradeObjective(type, q.answer, parsed.data);
}

async function updateMastery(userId: string, outcomeCode: string, credit: number, correct: boolean) {
  const m = await prisma.mastery.findUnique({ where: { userId_outcomeCode: { userId, outcomeCode } } });
  const score = nextMasteryScore(m?.score ?? 0, m?.attempts ?? 0, credit);
  await prisma.mastery.upsert({
    where: { userId_outcomeCode: { userId, outcomeCode } },
    create: { userId, outcomeCode, attempts: 1, correct: correct ? 1 : 0, score },
    update: { attempts: { increment: 1 }, correct: { increment: correct ? 1 : 0 }, score },
  });
}

export async function answerItem(user: SessionUser, attemptId: string, itemId: string, response: unknown) {
  const a = await loadOwnAttempt(user, attemptId);
  if (a.userId !== user.id) throw new HttpError(403, "Only the learner can answer.");
  if (a.status === "SUBMITTED") throw new HttpError(400, "This attempt has been submitted.");
  const it = a.items.find((i) => i.id === itemId);
  if (!it) throw new HttpError(404, "Item not found.");
  if (a.mode === "PRACTICE" && it.answeredAt) throw new HttpError(400, "Already answered.");
  const g = await grade(it.question, response);
  const credit = a.mode === "PRACTICE" ? applyHintPenalty(g.credit, it.hintsUsed) : g.credit;
  const updated = await prisma.attemptItem.update({
    where: { id: it.id },
    data: {
      response: response as Prisma.InputJsonValue,
      isCorrect: g.isCorrect,
      credit: g.credit,
      marksAwarded: Math.round(credit * it.question.marks * 100) / 100,
      aiFeedback: [g.feedback, g.note].filter(Boolean).join(" ") || null,
      answeredAt: new Date(),
    },
    include: { question: true },
  });
  if (a.mode === "PRACTICE") {
    await updateMastery(user.id, it.question.outcomeCode, credit, g.isCorrect);
    return { saved: true, parts: g.parts, feedback: feedbackFor(updated) };
  }
  return { saved: true };
}

export async function submitAttempt(user: SessionUser, attemptId: string) {
  const a = await loadOwnAttempt(user, attemptId);
  if (a.userId !== user.id) throw new HttpError(403, "Only the learner can submit.");
  if (a.status === "SUBMITTED") return attemptView(user, attemptId);
  const counted = a.mode === "TEST" ? a.items : a.items.filter((i) => i.answeredAt);
  if (a.mode === "TEST") {
    for (const it of a.items) {
      // Unanswered test items are assessed as zero.
      await updateMastery(user.id, it.question.outcomeCode, it.answeredAt ? it.credit : 0, Boolean(it.isCorrect));
    }
  }
  const score = counted.reduce((s, i) => s + i.marksAwarded, 0);
  const maxScore = counted.reduce((s, i) => s + i.question.marks, 0);
  await prisma.attempt.update({ where: { id: a.id }, data: { status: "SUBMITTED", submittedAt: new Date(), score, maxScore } });
  return attemptView(user, attemptId);
}
