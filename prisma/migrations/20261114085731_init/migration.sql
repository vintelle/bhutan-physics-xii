-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Bloom" AS ENUM ('REMEMBERING', 'UNDERSTANDING', 'APPLYING', 'ANALYSING', 'EVALUATING', 'CREATING');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'MATCHING', 'NUMERICAL', 'ASSERTION_REASON', 'CONCEPTUAL');

-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('SK', 'WS', 'SV');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('SEED', 'TEACHER', 'AI_GENERATED', 'IG_ADAPTED');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuizMode" AS ENUM ('PRACTICE', 'TEST');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "school" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("userId","classId")
);

-- CreateTable
CREATE TABLE "Theme" (
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "weighting" INTEGER NOT NULL,
    "competencies" JSONB NOT NULL,
    "ks5Standards" JSONB NOT NULL,
    "igPages" TEXT NOT NULL,
    "scfTable" INTEGER NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Topic" (
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "weighting" INTEGER NOT NULL,
    "themeCode" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Subtopic" (
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "igPedagogy" TEXT NOT NULL,
    "extraConcepts" TEXT[],
    "topicCode" TEXT NOT NULL,

    CONSTRAINT "Subtopic_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "LearningOutcome" (
    "code" TEXT NOT NULL,
    "roman" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "bloomPrimary" "Bloom" NOT NULL,
    "practical" BOOLEAN NOT NULL,
    "numerical" BOOLEAN NOT NULL,
    "sep" TEXT[],
    "subtopics" TEXT[],
    "themeCode" TEXT NOT NULL,
    "topicCode" TEXT NOT NULL,

    CONSTRAINT "LearningOutcome_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "IgExemplar" (
    "id" TEXT NOT NULL,
    "themeCode" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "n" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "hasFigure" BOOLEAN NOT NULL,
    "subtopicNumber" TEXT,

    CONSTRAINT "IgExemplar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "bloom" "Bloom" NOT NULL,
    "domain" "Domain" NOT NULL DEFAULT 'SK',
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "stem" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "answer" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "misconception" TEXT NOT NULL,
    "hints" TEXT[],
    "solutionSteps" TEXT[],
    "scopeNote" TEXT,
    "source" "QuestionSource" NOT NULL DEFAULT 'SEED',
    "status" "QuestionStatus" NOT NULL DEFAULT 'DRAFT',
    "outcomeCode" TEXT NOT NULL,
    "subtopicNumber" TEXT,
    "exemplarId" TEXT,
    "authorId" TEXT,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mode" "QuizMode" NOT NULL DEFAULT 'TEST',
    "timeLimitMin" INTEGER,
    "blueprint" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "quizId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("quizId","questionId")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT,
    "mode" "QuizMode" NOT NULL,
    "title" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptItem" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "response" JSONB,
    "isCorrect" BOOLEAN,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marksAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "aiFeedback" TEXT,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "AttemptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mastery" (
    "userId" TEXT NOT NULL,
    "outcomeCode" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mastery_pkey" PRIMARY KEY ("userId","outcomeCode")
);

-- CreateTable
CREATE TABLE "TutorSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Class_joinCode_key" ON "Class"("joinCode");

-- CreateIndex
CREATE INDEX "Question_outcomeCode_status_idx" ON "Question"("outcomeCode", "status");

-- CreateIndex
CREATE INDEX "Question_type_bloom_idx" ON "Question"("type", "bloom");

-- CreateIndex
CREATE INDEX "Attempt_userId_submittedAt_idx" ON "Attempt"("userId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptItem_attemptId_order_key" ON "AttemptItem"("attemptId", "order");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_themeCode_fkey" FOREIGN KEY ("themeCode") REFERENCES "Theme"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtopic" ADD CONSTRAINT "Subtopic_topicCode_fkey" FOREIGN KEY ("topicCode") REFERENCES "Topic"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningOutcome" ADD CONSTRAINT "LearningOutcome_themeCode_fkey" FOREIGN KEY ("themeCode") REFERENCES "Theme"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningOutcome" ADD CONSTRAINT "LearningOutcome_topicCode_fkey" FOREIGN KEY ("topicCode") REFERENCES "Topic"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgExemplar" ADD CONSTRAINT "IgExemplar_subtopicNumber_fkey" FOREIGN KEY ("subtopicNumber") REFERENCES "Subtopic"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_outcomeCode_fkey" FOREIGN KEY ("outcomeCode") REFERENCES "LearningOutcome"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_subtopicNumber_fkey" FOREIGN KEY ("subtopicNumber") REFERENCES "Subtopic"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptItem" ADD CONSTRAINT "AttemptItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptItem" ADD CONSTRAINT "AttemptItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mastery" ADD CONSTRAINT "Mastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mastery" ADD CONSTRAINT "Mastery_outcomeCode_fkey" FOREIGN KEY ("outcomeCode") REFERENCES "LearningOutcome"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorSession" ADD CONSTRAINT "TutorSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TutorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
