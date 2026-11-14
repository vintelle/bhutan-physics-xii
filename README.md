# Bhutan Grade XII Physics Quiz Platform

A curriculum-aligned practice and assessment platform for Class XII Physics in Bhutan. It is built strictly from the **Science Curriculum Framework PP–XII (2022)** and the **Instructional Guide for Physics XI & XII (2022)**.

- **Students:** practise by learning outcome; get instant feedback with the answer, explanation, common misconception and three graduated hints; track mastery and improvement; and ask a hint-first AI tutor.
- **Teachers:** manage a question bank (write, upload, AI-generate, review), generate tests weighted by the curriculum, and see which outcomes their class needs help with.

Stack: Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · PostgreSQL (Prisma) · Claude API (`claude-opus-5-5`).

## Quick start

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npx prisma migrate deploy && SEED_DEMO=true npx prisma db seed
```

```bash
npm run dev
```

With `SEED_DEMO=true`, demo logins are `karma@demo.bt` (student) and `teacher@demo.bt` (teacher), password `physics123`.

## Deliverables

| # | Deliverable | Where |
|---|---|---|
| 0 | Curriculum analysis and learning-outcome extraction | [docs/01-curriculum-analysis.md](docs/01-curriculum-analysis.md), [curriculum/](curriculum/) |
| 1 | Product Requirements Document | [docs/02-product-requirements.md](docs/02-product-requirements.md) |
| 2 | Database schema | [docs/03-database-schema.md](docs/03-database-schema.md), [prisma/schema.prisma](prisma/schema.prisma) |
| 3 | API design | [docs/04-api-design.md](docs/04-api-design.md) |
| 4 | Folder structure | [docs/05-folder-structure.md](docs/05-folder-structure.md) |
| 5 | Wireframes (plus screenshots of the built app) | [docs/06-wireframes.md](docs/06-wireframes.md) |
| 6 | Source code | [src/](src/), [prisma/](prisma/) |
| 7 | Deployment instructions | [docs/07-deployment.md](docs/07-deployment.md), [Dockerfile](Dockerfile), [docker-compose.yml](docker-compose.yml) |

## What's in the box

- **Curriculum:** 5 themes, 13 topics, 48 sub-topics with official scope, 47 learning outcomes, 24 competencies, and 172 verbatim IG exemplar questions.
- **Question bank:** 95 seed items covering every outcome and all 7 types (MCQ, True/False, Fill in the blanks, Matching, Numerical, Assertion–Reason, Conceptual), at Bloom levels Remembering to Evaluating, each with full feedback.
- **AI:** question generation (structured outputs; saved as drafts for teacher review), a streaming tutor, and rubric marking of written answers. All three share a cached curriculum system prompt and have server-side refusal fallback.

## Tests

```bash
npm test
```

Runs 12 unit tests: grading, hint penalty, mastery model, blueprint weighting, schema validation, every seed answer key self-grading as correct, and full outcome/type coverage.
