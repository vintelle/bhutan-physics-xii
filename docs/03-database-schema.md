# Database schema (PostgreSQL + Prisma)

Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma). The initial migration is in `prisma/migrations/`.

## Entity–relationship overview

```mermaid
erDiagram
  Theme ||--o{ Topic : has
  Theme ||--o{ LearningOutcome : groups
  Topic ||--o{ Subtopic : has
  Topic ||--o{ LearningOutcome : has
  Subtopic ||--o{ IgExemplar : "IG questions"
  Subtopic ||--o{ Question : tags
  LearningOutcome ||--o{ Question : assesses
  LearningOutcome ||--o{ Mastery : "tracked by"
  User ||--o{ Class : teaches
  User ||--o{ Enrollment : joins
  Class ||--o{ Enrollment : has
  Class ||--o{ Quiz : "assigned"
  User ||--o{ Quiz : creates
  Quiz ||--o{ QuizQuestion : contains
  Question ||--o{ QuizQuestion : "used in"
  User ||--o{ Attempt : takes
  Quiz ||--o{ Attempt : "attempted as"
  Attempt ||--o{ AttemptItem : contains
  Question ||--o{ AttemptItem : "answered as"
  User ||--o{ Mastery : has
  User ||--o{ TutorSession : chats
  TutorSession ||--o{ TutorMessage : contains
```

## Tables

### Curriculum (read-mostly, seeded)

| Table | Key | Important columns | Notes |
|---|---|---|---|
| `Theme` | `code` (NM, FMT, EM, WO, ANSP) | name, order, minutes, weighting %, competencies (json string[]), ks5Standards (json), igPages, scfTable | 5 rows; weighting sums to 100 |
| `Topic` | `code` (e.g. `EM.3`) | name, minutes, weighting, themeCode | 13 rows (IG Annexure 2) |
| `Subtopic` | `number` (e.g. `3.3.3`) | title, scope, igPedagogy, extraConcepts text[] | 48 rows; *scope* bounds item content |
| `LearningOutcome` | `code` (`XII.EM.07`) | roman, statement, bloomPrimary, practical, numerical, sep text[], subtopics text[], themeCode, topicCode | 47 rows |
| `IgExemplar` | `id` (`IG-XII-EM-3.4.3-1`) | kind (exemplar/revision), text, hasFigure, subtopicNumber | 172 rows, verbatim from IG |

### Users and classes

| Table | Key | Columns |
|---|---|---|
| `User` | cuid | name, email (unique), passwordHash (bcrypt), role `STUDENT/TEACHER/ADMIN`, school |
| `Class` | cuid | name, joinCode (unique, 6 chars), teacherId |
| `Enrollment` | (userId, classId) | joinedAt |

### Assessment items

`Question`

| Column | Type | Meaning |
|---|---|---|
| type | enum `MCQ, TRUE_FALSE, FILL_BLANK, MATCHING, NUMERICAL, ASSERTION_REASON, CONCEPTUAL` | |
| bloom | enum `REMEMBERING … CREATING` | |
| domain | enum `SK, WS, SV` | SCF assessment domain |
| difficulty, marks | int | 1–3; 1–10 |
| stem | text | blanks marked `____` for FILL_BLANK |
| payload | jsonb | type-specific, shown to students (see below) |
| answer | jsonb | type-specific; **never** sent before the learner may see it |
| explanation, misconception | text | feedback engine |
| hints | text[3] | revealed in order |
| solutionSteps | text[] | required for NUMERICAL |
| scopeNote | text? | for IG-only extra concepts |
| source | enum `SEED, TEACHER, AI_GENERATED, IG_ADAPTED` | |
| status | enum `DRAFT, APPROVED, ARCHIVED` | students see APPROVED only |
| outcomeCode, subtopicNumber | FK | curriculum anchor |
| authorId, reviewerId | FK User | review audit |

Indexes: `(outcomeCode, status)`, `(type, bloom)`.

**Payload / answer shapes**

| Type | payload | answer |
|---|---|---|
| MCQ | `{ options: string[3-6] }` | `{ index }` |
| TRUE_FALSE | `{}` | `{ value: boolean }` |
| FILL_BLANK | `{}` | `{ blanks: string[][] }`: accepted alternatives per blank |
| MATCHING | `{ left: string[], right: string[] }` (right shuffled) | `{ pairs: number[] }`: `right[pairs[i]]` matches `left[i]` |
| NUMERICAL | `{ unit }` | `{ value, tolerancePct }` |
| ASSERTION_REASON | `{ assertion, reason }` (+ standard 5-option key added at render) | `{ index: 0-4 }` |
| CONCEPTUAL | `{ keyPoints: string[] }` (hidden until feedback) | `{ modelAnswer }` |

### Quizzes and attempts

| Table | Key | Columns |
|---|---|---|
| `Quiz` | cuid | title, description, mode `PRACTICE/TEST`, timeLimitMin, blueprint (json: request, perTopic, perBloom, shortfall), published, dueAt, createdById, classId |
| `QuizQuestion` | (quizId, questionId) | order |
| `Attempt` | cuid | userId, quizId?, mode, title, scope (json: outcomes), status `IN_PROGRESS/SUBMITTED`, score, maxScore, startedAt, submittedAt. Index `(userId, submittedAt)` |
| `AttemptItem` | cuid, unique (attemptId, order) | questionId, response (json), isCorrect, credit (0–1 raw), marksAwarded (after hint penalty), hintsUsed, aiFeedback, answeredAt |
| `Mastery` | (userId, outcomeCode) | attempts, correct, score (EWMA 0–1), updatedAt |

### AI tutor

| Table | Columns |
|---|---|
| `TutorSession` | userId, title, createdAt |
| `TutorMessage` | sessionId, role `user/assistant`, content, createdAt |

## Integrity rules enforced in code

- `questionInputSchema` (zod) validates payload/answer per type, blank counts, matching bijection, exactly 3 hints, and solution steps for numericals.
- `saveQuestion` rejects unknown outcomes and forces the sub-topic to one belonging to the outcome.
- Questions referenced by any `AttemptItem` are archived instead of deleted.
- Quizzes may only contain APPROVED questions.

## Typical queries

- Topic practice pool: `Question WHERE status='APPROVED' AND outcomeCode IN (...)` (index-backed).
- Class intervention list: `Mastery WHERE userId IN (class students)`, aggregated per outcome in the service layer.
- Most-missed: `AttemptItem JOIN Question` for class students, grouped by question (≥ 3 responses).
