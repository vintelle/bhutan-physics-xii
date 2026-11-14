/**
 * Seed: curriculum (SCF 2022 + Physics IG 2022), IG exemplar questions, the seed question bank,
 * and (only when SEED_DEMO=true) demo accounts with realistic practice history for the dashboards.
 *   npx prisma db seed
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { seedQuestions } from "./seed-questions";
import { questionInputSchema } from "../src/lib/questions";
import { nextMasteryScore } from "../src/lib/mastery";
import { buildBlueprint } from "../src/lib/blueprint";

const prisma = new PrismaClient();
const root = process.cwd();
const cur = JSON.parse(readFileSync(join(root, "curriculum/class-xii-physics.json"), "utf8"));
const exemplars = JSON.parse(readFileSync(join(root, "curriculum/ig-exemplars.json"), "utf8"));
const up = (s: string) => s.toUpperCase() as "APPLYING";

async function seedCurriculum() {
  for (const t of cur.themes)
    await prisma.theme.upsert({
      where: { code: t.code },
      create: { code: t.code, order: t.order, name: t.name, minutes: t.minutes, weighting: t.weighting, competencies: t.competencies, ks5Standards: t.ks5_standards, igPages: t.ig_pages, scfTable: t.scf_table },
      update: { name: t.name, minutes: t.minutes, weighting: t.weighting, competencies: t.competencies, ks5Standards: t.ks5_standards },
    });
  let order = 0;
  for (const tp of cur.topics)
    await prisma.topic.upsert({ where: { code: tp.code }, create: { code: tp.code, order: order++, name: tp.name, minutes: tp.minutes, weighting: tp.weighting, themeCode: tp.theme }, update: { name: tp.name, minutes: tp.minutes, weighting: tp.weighting } });
  for (const s of cur.subtopics)
    await prisma.subtopic.upsert({
      where: { number: s.number },
      create: { number: s.number, title: s.title, scope: s.scope, igPedagogy: s.ig_pedagogy, extraConcepts: s.ig_extra_concepts, topicCode: s.topic },
      update: { title: s.title, scope: s.scope, igPedagogy: s.ig_pedagogy, extraConcepts: s.ig_extra_concepts },
    });
  for (const o of cur.learning_objectives)
    await prisma.learningOutcome.upsert({
      where: { code: o.code },
      create: { code: o.code, roman: o.roman, statement: o.statement, bloomPrimary: up(o.bloom_primary), practical: o.practical, numerical: o.numerical, sep: o.sep, subtopics: o.subtopics, themeCode: o.theme, topicCode: o.topic },
      update: { statement: o.statement, bloomPrimary: up(o.bloom_primary), practical: o.practical, numerical: o.numerical, sep: o.sep, subtopics: o.subtopics },
    });
  for (const e of exemplars)
    await prisma.igExemplar.upsert({
      where: { id: e.id },
      create: { id: e.id, themeCode: e.theme, kind: e.kind, n: e.n, text: e.text, hasFigure: e.has_figure, subtopicNumber: e.subtopic },
      update: { text: e.text, hasFigure: e.has_figure },
    });
  console.log(`curriculum: ${cur.themes.length} themes, ${cur.topics.length} topics, ${cur.subtopics.length} sub-topics, ${cur.learning_objectives.length} outcomes, ${exemplars.length} IG exemplars`);
}

async function seedQuestionBank() {
  const existing = await prisma.question.count({ where: { source: "SEED" } });
  if (existing > 0) {
    console.log(`question bank: ${existing} seed items already present - skipped`);
    return;
  }
  let n = 0;
  for (const raw of seedQuestions) {
    const q = questionInputSchema.parse(raw); // fail loudly on any malformed seed item
    await prisma.question.create({
      data: {
        type: q.type, bloom: q.bloom, domain: q.domain, difficulty: q.difficulty, marks: q.marks, stem: q.stem,
        payload: q.payload as Prisma.InputJsonValue, answer: q.answer as Prisma.InputJsonValue, explanation: q.explanation,
        misconception: q.misconception, hints: q.hints, solutionSteps: q.solutionSteps, outcomeCode: q.outcomeCode,
        subtopicNumber: q.subtopicNumber ?? undefined, source: "SEED", status: "APPROVED",
      },
    });
    n++;
  }
  console.log(`question bank: ${n} approved seed items`);
}

// Deterministic pseudo-random numbers so demo data is reproducible.
let s = 42;
const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);

async function seedDemo() {
  if (process.env.SEED_DEMO !== "true") return; // demo accounts only when explicitly requested
  if (await prisma.user.findUnique({ where: { email: "teacher@demo.bt" } })) {
    console.log("demo: already present - skipped");
    return;
  }
  const passwordHash = await bcrypt.hash("physics123", 10);
  const teacher = await prisma.user.create({ data: { name: "Tashi Wangmo", email: "teacher@demo.bt", role: "TEACHER", school: "Demo Higher Secondary School", passwordHash } });
  const cls = await prisma.class.create({ data: { name: "XII Science A", joinCode: "XIISCA", teacherId: teacher.id } });
  // Each demo learner has a strength profile per theme (probability of a correct answer before practice).
  const learners = [
    { name: "Karma Dorji", email: "karma@demo.bt", skill: { NM: 0.8, FMT: 0.75, EM: 0.7, WO: 0.65, ANSP: 0.8 } },
    { name: "Pema Choden", email: "pema@demo.bt", skill: { NM: 0.6, FMT: 0.55, EM: 0.4, WO: 0.5, ANSP: 0.65 } },
    { name: "Sonam Tshering", email: "sonam@demo.bt", skill: { NM: 0.5, FMT: 0.6, EM: 0.35, WO: 0.3, ANSP: 0.55 } },
    { name: "Dechen Wangchuk", email: "dechen@demo.bt", skill: { NM: 0.7, FMT: 0.5, EM: 0.55, WO: 0.45, ANSP: 0.4 } },
  ];
  const bank = await prisma.question.findMany({ where: { status: "APPROVED" }, include: { outcome: true } });
  const now = Date.now();
  for (const l of learners) {
    const u = await prisma.user.create({ data: { name: l.name, email: l.email, role: "STUDENT", passwordHash, enrollments: { create: { classId: cls.id } } } });
    const mastery = new Map<string, { attempts: number; correct: number; score: number }>();
    for (let w = 0; w < 8; w++) {
      const when = new Date(now - (8 - w) * 6 * 86400_000 + Math.floor(rand() * 86400_000));
      const theme = (["NM", "FMT", "EM", "WO", "ANSP"] as const)[(w + learners.indexOf(l)) % 5];
      const picks = bank.filter((q) => q.outcome.themeCode === theme || rand() < 0.15).sort(() => rand() - 0.5).slice(0, 8);
      let score = 0, max = 0;
      const items = picks.map((q, i) => {
        const pCorrect = Math.min(0.95, l.skill[q.outcome.themeCode as keyof typeof l.skill] + w * 0.03 - (q.difficulty - 2) * 0.1);
        const ok = rand() < pCorrect;
        const hints = ok ? (rand() < 0.3 ? 1 : 0) : (rand() < 0.5 ? 2 : 0);
        const credit = ok ? Math.max(0.4, 1 - 0.15 * hints) : 0;
        score += credit * q.marks;
        max += q.marks;
        const m = mastery.get(q.outcomeCode) ?? { attempts: 0, correct: 0, score: 0 };
        m.score = nextMasteryScore(m.score, m.attempts, credit);
        m.attempts++;
        if (ok) m.correct++;
        mastery.set(q.outcomeCode, m);
        return { questionId: q.id, order: i, isCorrect: ok, credit: ok ? 1 : 0, marksAwarded: credit * q.marks, hintsUsed: hints, answeredAt: when, response: {} };
      });
      await prisma.attempt.create({
        data: { userId: u.id, mode: "PRACTICE", title: `Practice: ${cur.themes.find((t: { code: string }) => t.code === theme).name}`, scope: {}, status: "SUBMITTED", score, maxScore: max, startedAt: when, submittedAt: new Date(when.getTime() + 20 * 60_000), items: { create: items } },
      });
    }
    for (const [outcomeCode, m] of mastery) await prisma.mastery.create({ data: { userId: u.id, outcomeCode, ...m } });
  }
  // A published unit test built with the blueprint generator (Electricity & Magnetism).
  const emTopics = cur.topics.filter((t: { theme: string }) => t.theme === "EM");
  const plan = buildBlueprint(
    bank.filter((q) => q.outcome.themeCode === "EM").map((q) => ({ id: q.id, topicCode: q.outcome.topicCode, outcomeCode: q.outcomeCode, bloom: q.bloom, type: q.type, difficulty: q.difficulty, marks: q.marks, timesUsed: 0 })),
    { questionCount: 12, topicWeights: Object.fromEntries(emTopics.map((t: { code: string; weighting: number }) => [t.code, t.weighting])), seed: 11 },
  );
  await prisma.quiz.create({
    data: {
      title: "Unit Test: Electricity and Magnetism", description: "Blueprint test weighted by IG Annexure 2 (Electricity 4, Capacitors 4, EMI 9, Electric Circuit 12).",
      mode: "TEST", timeLimitMin: 30, published: true, createdById: teacher.id, classId: cls.id,
      blueprint: { perTopic: plan.perTopic, perBloom: plan.perBloom, shortfall: plan.shortfall } as Prisma.InputJsonValue,
      questions: { create: plan.questionIds.map((questionId, order) => ({ questionId, order })) },
    },
  });
  console.log("demo: teacher@demo.bt + 4 students (password physics123), class XII Science A (join code XIISCA), 1 published unit test");
}

async function main() {
  await seedCurriculum();
  await seedQuestionBank();
  await seedDemo();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
