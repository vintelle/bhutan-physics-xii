# API design

REST over JSON, implemented as Next.js route handlers in `src/app/api/**/route.ts`.

- **Auth:** session cookie `pq_session` (HS256 JWT, 14 days, httpOnly, SameSite=Lax, Secure in production) set by `/api/auth/login` or `/register`.
- **Errors:** `{ "error": string, "details"?: unknown }` with 400 (bad body), 401 (signed out), 403 (role/ownership), 404, 409 (duplicate), 422 (validation, `details` = zod issues), 503 (AI not configured), 500.
- **Roles:** 🎓 any signed-in user · 👩‍🏫 teacher/admin only.

## Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password(≥8), role: STUDENT\|TEACHER, school?, joinCode?, teacherCode? }` | 201 `{ id, name, role }` + cookie. `teacherCode` required when `TEACHER_SIGNUP_CODE` is set |
| POST | `/api/auth/login` | `{ email, password }` | `{ id, name, role }` + cookie |
| POST | `/api/auth/logout` | | `{ ok: true }` |
| GET 🎓 | `/api/me` | | user, classes, `aiEnabled` |

## Curriculum

| Method | Path | Notes |
|---|---|---|
| GET | `/api/curriculum` | Theme → topics → subtopics + outcomes, each outcome with `approvedQuestions` |
| GET 👩‍🏫 | `/api/exemplars?outcome=XII.EM.11` \| `?subtopic=3.4.3` \| `?theme=EM` | Verbatim IG questions |

## Classes

| Method | Path | Body | Notes |
|---|---|---|---|
| GET 🎓 | `/api/classes` | | Teacher: own classes with student counts. Student: enrolled classes |
| POST 👩‍🏫 | `/api/classes` | `{ name }` | Creates class with random 6-char join code |
| POST 🎓 | `/api/classes/join` | `{ joinCode }` | Idempotent enrolment |

## Question bank 👩‍🏫

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/questions` | `outcome, topic, type, bloom, status, source, q, page, pageSize(≤100)` | `{ total, page, pageSize, items }`. Default excludes ARCHIVED |
| POST | `/api/questions` | `{ question: QuestionInput, status?: DRAFT\|APPROVED }` | Teacher-authored, APPROVED by default |
| GET | `/api/questions/:id` | | Includes outcome and subtopic |
| PATCH | `/api/questions/:id` | `{ status?, question? }` | Approve / move to draft / archive / full edit (re-validated) |
| DELETE | `/api/questions/:id` | | Deletes if unused, otherwise archives |
| POST | `/api/questions/upload` | `{ format: csv\|json, content, status }` | Per-row results `{ saved, failed, results[] }` |
| POST | `/api/questions/generate` | `{ outcomeCode, type, bloom (≤ EVALUATING), count 1–5, difficulty?, context? }` | Claude-generated, saved as DRAFT `AI_GENERATED`. `{ saved[], rejected[] }` |

### `QuestionInput`

```json
{
  "type": "NUMERICAL",
  "bloom": "APPLYING",
  "domain": "SK",
  "difficulty": 2,
  "marks": 1,
  "outcomeCode": "XII.EM.11",
  "subtopicNumber": "3.4.3",
  "stem": "A loop contains a 12 V cell and a 4.0 V cell in opposition with 2.0 Ω and 6.0 Ω in series. Find the current.",
  "payload": { "unit": "A" },
  "answer": { "value": 1.0, "tolerancePct": 2 },
  "explanation": "Net e.m.f. 8.0 V over 8.0 Ω gives 1.0 A (Kirchhoff's loop law).",
  "misconception": "Adding opposing e.m.f.s.",
  "hints": ["Go round the loop adding e.m.f.s with signs.", "Opposing cells: subtract.", "I = 8.0/8.0."],
  "solutionSteps": ["Given: …", "Formula: ΣE = ΣIR", "Answer: 1.0 A"]
}
```

Per-type `payload`/`answer` shapes: see [`03-database-schema.md`](03-database-schema.md#assessment-items).

### CSV upload columns

`type, outcomeCode, subtopicNumber, bloom, domain, difficulty, marks, stem, options, answer, explanation, misconception, hint1, hint2, hint3, solutionSteps, unit, tolerancePct, assertion, reason, left, right, keyPoints`

| Type | Required type-specific columns | `answer` column |
|---|---|---|
| MCQ | `options` = `opt A\|opt B\|opt C\|opt D` | letter `A`–`F` or 0-based index |
| TRUE_FALSE | | `true` / `false` |
| FILL_BLANK | stem with `____` | blanks separated by `\|\|`, alternatives by `\|` (e.g. `n\|n-type\|\|electrons`) |
| MATCHING | `left` and `right` with `\|`, **right written in matching order** (shuffled on import) | (empty) |
| NUMERICAL | `unit`, optional `tolerancePct` (default 2) | number |
| ASSERTION_REASON | `assertion`, `reason` | letter `A`–`E` of the standard key |
| CONCEPTUAL | `keyPoints` with `\|` | model answer |

`solutionSteps` use `|` between steps. A two-row template is available from **Question bank → Upload → Load CSV template**.

## Quizzes

| Method | Path | Body | Notes |
|---|---|---|---|
| GET 🎓 | `/api/quizzes` | | Teacher: own quizzes with counts. Student: published quizzes for their classes, with their latest attempt |
| POST 👩‍🏫 | `/api/quizzes` | `{ title, description?, mode, timeLimitMin?, classId?, dueAt?, published, questionIds[] }` | All questions must be APPROVED |
| POST 👩‍🏫 | `/api/quizzes/generate` | `{ title, mode, timeLimitMin?, classId?, published, topics[], questionCount 3–60, bloomMix?, types?, preview }` | Blueprint generator. `preview: true` returns `{ plan }` only |
| GET 🎓 | `/api/quizzes/:id` | | Teacher: full quiz and results. Student: metadata if published |
| PATCH 👩‍🏫 | `/api/quizzes/:id` | `{ published?, title?, timeLimitMin? }` | |
| DELETE 👩‍🏫 | `/api/quizzes/:id` | | Attempts are kept (quizId set null) |

`plan = { questionIds[], perTopic{code:{target,picked}}, perBloom{level:{target,picked}}, shortfall[] }`

## Attempts (practice and tests) 🎓

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/attempts` | | Own last 50 attempts |
| POST | `/api/attempts` | `{ kind: "practice", outcomes[], count, types? }` \| `{ kind: "review", count }` \| `{ kind: "quiz", quizId }` | Creates an attempt (resumes an in-progress quiz attempt) |
| GET | `/api/attempts/:id` | | Items with **public** payload; `feedback` only when allowed (practice and answered, or submitted) |
| POST | `/api/attempts/:id/hint` | `{ itemId }` | Practice only, before answering → `{ hintsShown[], hintsUsed }` |
| POST | `/api/attempts/:id/answer` | `{ itemId, response }` | Practice: grades, updates mastery and returns `feedback`. Test: saves (overwritable) |
| POST | `/api/attempts/:id/submit` | | Finalises the score; in tests updates mastery for every item (unanswered = 0) |

`response` shapes: MCQ/AR `{index}`, TF `{value}`, FILL `{blanks: string[]}`, MATCHING `{pairs: number[]}`, NUMERICAL `{value: string|number}`, CONCEPTUAL `{text}`.

`feedback = { isCorrect, credit, marksAwarded, answer, explanation, misconception, solutionSteps[], hints[3], keyPoints?, aiFeedback? }`

## Progress and analytics

| Method | Path | Notes |
|---|---|---|
| GET 🎓 | `/api/progress[?userId=]` | `{ summary, outcomes[], topics[], trend[], weakOutcomes[] }`. Teachers may pass `userId` of a student in their classes |
| GET 👩‍🏫 | `/api/analytics/class?classId=` | `{ class, topics[], outcomes[], interventions[], mostMissed[], trend[], students[] }` |

## AI tutor 🎓

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/tutor` | | Recent conversations |
| GET | `/api/tutor/:id` | | Conversation with messages |
| POST | `/api/tutor` | `{ sessionId?, message }` | **Streams** `text/plain` chunks; header `X-Session-Id`. 503 if no API key |

## Claude integration (server-side only)

| Feature | Call | Model / settings |
|---|---|---|
| Question generation | `client.beta.messages.parse` + `betaZodOutputFormat` (type-specific schema) | `claude-opus-5-5`, effort `high`, `fallbacks: "default"` |
| Written-answer marking | `client.beta.messages.parse` | effort `low`, student text fenced in `<student_answer>` |
| Tutor | `client.beta.messages.stream` | effort `medium` |

All three share one byte-stable system block with the full curriculum outline (~7k tokens), cached with `cache_control: {type: "ephemeral", ttl: "1h"}`; role instructions follow in a second block. `stop_reason === "refusal"` is checked on every call; the server-side fallback (`server-side-fallback-2026-07-01`) re-routes declined requests automatically.
