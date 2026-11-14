# Folder structure

```
bhutan-physics-xii/
├── curriculum/                      # Curriculum data (the single source of truth for content scope)
│   ├── class-xii-physics.json       #   5 themes · 13 topics · 48 sub-topics · 47 outcomes · competencies · practicals
│   ├── ig-exemplars.json            #   172 verbatim IG questions mapped to sub-topics
│   ├── build_curriculum.py          #   rebuilds the JSON (edit here when the curriculum changes)
│   ├── build_report.py              #   regenerates docs/01-curriculum-analysis.md from the JSON
│   └── extract_ig_exemplars.py      #   extracts exemplar questions from the IG text
├── docs/
│   ├── 01-curriculum-analysis.md    # learning-outcome extraction, scope rules, source discrepancies
│   ├── 02-product-requirements.md   # PRD
│   ├── 03-database-schema.md
│   ├── 04-api-design.md
│   ├── 05-folder-structure.md       # (this file)
│   ├── 06-wireframes.md
│   └── 07-deployment.md
├── prisma/
│   ├── schema.prisma                # PostgreSQL schema
│   ├── migrations/                  # SQL migrations (prisma migrate)
│   ├── seed.ts                      # curriculum + exemplars + question bank + optional demo data
│   └── seed-questions.ts            # 95 curriculum-aligned items with full feedback
├── src/
│   ├── middleware.ts                # route protection by role
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx, globals.css  # shell, design tokens (light/dark)
│   │   ├── page.tsx                 # Landing
│   │   ├── login/, register/        # Auth pages
│   │   ├── student/                 # Student dashboard
│   │   ├── practice/                # Topic practice picker
│   │   ├── quiz/[attemptId]/        # Quiz page (practice and test)
│   │   ├── analytics/               # Student progress (teachers: ?userId=)
│   │   ├── tutor/                   # AI tutor
│   │   ├── teacher/                 # Teacher dashboard
│   │   │   ├── questions/           #   question bank: browse/review · write · upload · AI generate · IG exemplars
│   │   │   ├── quizzes/             #   blueprint test generator + quiz list
│   │   │   │   └── [id]/            #   quiz detail and results
│   │   │   └── analytics/           #   class analytics
│   │   └── api/                     # REST route handlers (see docs/04-api-design.md)
│   │       ├── auth/{register,login,logout}
│   │       ├── me, curriculum, exemplars, classes, classes/join
│   │       ├── questions, questions/[id], questions/upload, questions/generate
│   │       ├── quizzes, quizzes/[id], quizzes/generate
│   │       ├── attempts, attempts/[id], attempts/[id]/{answer,hint,submit}
│   │       ├── progress, analytics/class
│   │       └── tutor, tutor/[id]
│   ├── components/
│   │   ├── ui.tsx                   # Card, buttons, badges, stat tile, mastery state chip
│   │   ├── charts.tsx               # BarList and TrendLine (tooltips and table view)
│   │   ├── QuestionRunner.tsx       # renders all 7 types, hint ladder, feedback, timer, results
│   │   ├── PracticePicker.tsx       # Theme → Topic → Outcome selector
│   │   ├── TutorChat.tsx, Markdown.tsx
│   │   ├── Nav.tsx, AuthForm.tsx, StartButton.tsx, JoinClass.tsx, LogoutButton.tsx, fetcher.ts
│   │   └── teacher/                 # QuestionBank, QuestionForm, QuizBuilder, QuizList, ClassManager
│   └── lib/
│       ├── questions.ts             # item types, Bloom levels, zod schemas (single validation point)
│       ├── grading.ts               # objective grading, numeric parsing, hint penalty, offline essay marking
│       ├── mastery.ts               # EWMA mastery model and thresholds
│       ├── blueprint.ts             # weighted test assembly
│       ├── curriculum.ts            # typed access to the curriculum JSON, prompt outline, scope list
│       ├── questionIO.ts            # save, CSV parsing and mapping
│       ├── services/attempts.ts     # practice/test engine
│       ├── services/analytics.ts    # student and class analytics
│       ├── ai/client.ts             # Claude client, cached curriculum system prompt, refusal handling
│       ├── ai/generate.ts           # question generation (structured outputs)
│       ├── ai/grade.ts              # written-answer marking
│       ├── ai/tutor.ts              # tutor persona + streaming
│       ├── auth.ts, session.ts, api.ts, db.ts
│       └── core.test.ts             # unit tests (grading, mastery, blueprint, seed-bank integrity)
├── Dockerfile, docker-compose.yml
├── .env.example
└── package.json, tsconfig.json, next.config.mjs, tailwind.config.ts, postcss.config.mjs
```

**Design rule:** content scope lives in `curriculum/`, validation in `src/lib/questions.ts`, and business rules in `src/lib/services`. Routes and pages stay thin.
