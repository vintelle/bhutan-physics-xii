# Product Requirements Document: Bhutan Grade XII Physics Quiz Platform

| | |
|---|---|
| Version | 1.0 (first release, built) |
| Curriculum sources | Science Curriculum Framework PP–XII (SCF, 2022/2025), Physics Instructional Guide XI & XII (IG, 2022): Class XII only |
| Curriculum analysis | [`01-curriculum-analysis.md`](01-curriculum-analysis.md) |

## 1. Problem and goal

Class XII Physics learners in Bhutan need regular practice that matches the national curriculum, with feedback that teaches, not just a mark. Teachers need a quick way to set balanced, curriculum-weighted tests and to see which learning outcomes their class has not yet mastered. Existing question sources are often textbook-based, include out-of-scope content, and give no diagnostic information.

**Goal:** help students master Grade XII Physics through continuous practice, feedback and progress tracking, strictly within the SCF/IG Class XII curriculum.

### Success measures

| Metric | Target (first term of use) |
|---|---|
| Students completing ≥ 1 practice set per week | 70% of enrolled learners |
| Learning outcomes with ≥ 1 approved item | 47/47 at launch (met: 95 seed items) |
| Average mastery gain on outcomes flagged "Needs work" after targeted practice | +20 points in 4 weeks |
| Teacher time to build a weighted unit test | < 2 minutes |
| AI-generated items approved by teachers without edits | ≥ 60% (quality signal for the generator) |

## 2. Users

| Persona | Needs |
|---|---|
| **Class XII student** (17–18 yrs, mobile phone often the main device, patchy bandwidth) | Topic-wise practice, hints before answers, clear worked solutions, see weak areas, ask questions any time |
| **Physics teacher** (one or more XII sections) | Upload and generate questions, assemble tests by curriculum weighting, monitor class and individual progress, find outcomes needing intervention |
| **School administrator** (optional) | Deploy, control teacher sign-up (`TEACHER_SIGNUP_CODE`), keep data on approved infrastructure |

## 3. Scope

### In scope (v1, all implemented)

1. **Curriculum-aligned question bank:** hierarchy Theme (Unit) → Topic (Chapter) → Sub-topic (Concept and Scope) → Learning Outcome → Assessment items; 5 themes, 13 topics, 48 sub-topics, 47 outcomes, 24 competencies, 172 IG exemplar questions.
2. **Seven item types:** MCQ, True/False, Fill in the blanks, Matching, Numerical, Assertion–Reason, Conceptual (written).
3. **Bloom's taxonomy:** every item tagged Remembering → Evaluating (Creating outcomes are flagged for performance tasks).
4. **Feedback engine:** for every item, the correct answer, a detailed explanation, a common misconception and Hints 1–3 (graduated); numericals also carry step-by-step working.
5. **Automatic question generation** (Claude), grounded in outcome statement, sub-topic scope, IG exemplars and SEPs; outputs saved as drafts for teacher review.
6. **Progress tracking:** quiz scores, outcome mastery (EWMA), weak topics, improvement over time.
7. **Teacher dashboard:** classes and join codes, upload (CSV/JSON), write/edit/approve items, AI generation, blueprint test generator, manual quiz from selection, publish/unpublish, quiz results.
8. **Analytics:** topic mastery, class performance trend, most-missed concepts with misconceptions, outcomes requiring intervention, student table and drill-down.
9. **AI tutor:** curriculum-bounded, hint-first, simple language, IG terminology, step-by-step numericals, conversation history.
10. **Seven UI areas:** landing, student dashboard, teacher dashboard, topic practice, quiz, analytics (student and class), AI tutor.

### Out of scope (v1)

- Figures/diagrams inside items (IG exemplars that need figures are flagged `hasFigure` and excluded from AI anchoring).
- Dzongkha UI localisation, offline/PWA mode, SSO with the Ministry's identity systems, parent accounts. See §10.
- BCSEA board-exam paper replication (its assessment overview is "to be confirmed" in the KS5 framework).

## 4. Functional requirements

### 4.1 Curriculum and question bank

| ID | Requirement | Status |
|---|---|---|
| QB-1 | Seed the full Class XII hierarchy from `curriculum/class-xii-physics.json` | ✅ |
| QB-2 | Every item references exactly one learning outcome (`XII.<THEME>.<nn>`) and one sub-topic of that outcome | ✅ enforced in schema and `saveQuestion` |
| QB-3 | Items carry type, Bloom level, assessment domain (SK/WS/SV), difficulty 1–3, marks | ✅ |
| QB-4 | Items have answer, explanation, misconception, exactly 3 hints; numericals require solution steps | ✅ `questionInputSchema` |
| QB-5 | Status workflow DRAFT → APPROVED → ARCHIVED; students only ever see APPROVED | ✅ |
| QB-6 | Bulk upload CSV/JSON with per-row validation report | ✅ |
| QB-7 | Items used in attempts are archived, not deleted, to keep analytics intact | ✅ |

### 4.2 Practice and quizzes (students)

| ID | Requirement | Status |
|---|---|---|
| PR-1 | Choose any mix of themes, topics, outcomes, count and types | ✅ |
| PR-2 | Selection favours unseen, then previously wrong items, and weaker outcomes; ordered by rising Bloom demand | ✅ |
| PR-3 | **Practice mode:** answer → immediate feedback; hints revealed one at a time *before* answering; −15% per hint (floor 40%) | ✅ |
| PR-4 | **Test mode:** no hints, no feedback until submit, optional timer with auto-submit, answers editable until submit | ✅ |
| PR-5 | Smart review: practice from the 4 weakest outcomes | ✅ |
| PR-6 | Numerical answers accept `1.2e-3`, `1.2 × 10^-3`, units; tolerance per item; power-of-ten slips get a targeted note | ✅ |
| PR-7 | Written answers marked by Claude against key points (offline fallback: keyword matching) | ✅ |
| PR-8 | Every feedback panel links to the AI tutor pre-filled with the question | ✅ |

### 4.3 Progress and analytics

| ID | Requirement | Status |
|---|---|---|
| AN-1 | Mastery per outcome: EWMA (α = 0.35) of hint-adjusted credit; Mastered ≥ 80% with ≥ 3 items; Needs work < 50% with ≥ 2 items | ✅ |
| AN-2 | Student: score trend, topic mastery, outcome table, weak list, improvement (recent half vs earlier half) | ✅ |
| AN-3 | Class: weekly trend, topic mastery, outcomes requiring intervention (< 50% of active students on track at ≥ 60%), most-missed items (≥ 3 responses), student table | ✅ |
| AN-4 | Teacher drill-down to any student in their classes | ✅ |
| AN-5 | Every chart has a table view and hover tooltips; status shown with icon + label | ✅ |

### 4.4 Teacher tools

| ID | Requirement | Status |
|---|---|---|
| TE-1 | Classes with 6-character join codes | ✅ |
| TE-2 | Blueprint test generator: topics weighted by IG Annexure 2, Bloom mix, type filter, preview with per-topic/per-Bloom targets and shortfall warnings | ✅ |
| TE-3 | Quiz from hand-picked approved items | ✅ |
| TE-4 | Publish/unpublish, delete, results per quiz | ✅ |
| TE-5 | AI generation by outcome × type × Bloom × difficulty × count (1–5) with optional context note | ✅ |
| TE-6 | View IG exemplar questions per outcome | ✅ |

### 4.5 AI tutor

| ID | Requirement | Status |
|---|---|---|
| AI-1 | Answers only Class XII curriculum content; redirects off-syllabus and Class XI-only questions | ✅ system prompt + scope list |
| AI-2 | Hint first; full solution after an attempt, on request, or after two hint rounds | ✅ |
| AI-3 | Numericals laid out Given → To find → Formula → Substitution → Answer | ✅ |
| AI-4 | Uses IG/SCF terminology, cites outcome codes, suggests IG activities | ✅ |
| AI-5 | Streams responses; history saved per conversation | ✅ |
| AI-6 | Refuses to help during a live test | ✅ (instruction) |

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Alignment | No content outside the 47 outcomes; AI prompts carry the full outline plus an explicit out-of-scope list; AI items never reach students unreviewed |
| Security | bcrypt password hashes; HS256 JWT in an httpOnly, SameSite=Lax cookie (Secure in production); role checks in middleware *and* every route; answers never sent before a learner may see them; student text sent to the AI grader is fenced and marked as untrusted |
| Privacy | Only name/email/school stored; no student data in AI prompts except the answer being marked or the tutor conversation |
| Performance | First-load JS ≈ 96–131 kB per page; pages server-rendered; the curriculum system prompt (~7k tokens) is prompt-cached for 1 hour |
| Accessibility | Keyboard focus rings, labelled controls, `aria-live` for tutor and timer, no colour-only status, reduced-motion respected, responsive to 320 px |
| Resilience | Platform fully usable without an API key (AI features show a notice; written answers keyword-marked); refusal fallback enabled server-side for every Claude call |
| Cost control | Effort tuned per route (generation `high`, tutor `medium`, grading `low`); generation capped at 5 items per call |

## 6. Assessment design rules (from SCF §10/§15 and IG)

- Three domains, **SK, WS and SV**, tagged on every item; Working Scientifically items use apparatus and data (vernier calliper, travelling microscope, potentiometer, Tan-A magnetometer, optical bench).
- Tests **ramp in demand** (SCF 10.15): ordered Remembering → Evaluating, then by difficulty.
- Default Bloom mix for Class XII tests: R 10 · U 25 · Ap 30 · An 20 · Ev 15 (teacher-adjustable).
- Topic weighting = IG Annexure 2 (sums to 100%).

## 7. Release criteria (all met in this build)

- [x] 47/47 outcomes have ≥ 1 approved item; all 7 types present (unit-tested)
- [x] Every seed answer key self-grades as correct; every numerical recomputed independently (33/33 within 2%)
- [x] End-to-end smoke test as student and teacher (auth, roles, practice, hints, test mode, upload, blueprint, analytics)
- [x] AI paths verified against a mock Messages API (request shape, structured output parsing, streaming)
- [x] Production build passes; no console errors; no horizontal overflow on a phone; light and dark themes

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| AI-generated physics errors | Schema validation, solve-before-finalise instruction, `high` effort, mandatory teacher approval, per-item misconception and steps visible during review |
| Curriculum revision (KS5 2026–2030 drafts change Class XII content) | Curriculum lives in one JSON built by a script; re-run `build_curriculum.py` and re-seed; outcome codes are stable keys |
| Over-reliance on hints | Hint penalty, and hints are disabled in tests |
| Bandwidth | Small bundles, server rendering, text-only items |

## 9. Analytics definitions

- **Credit:** 0–1 per item (partial credit for blanks/matching/close numericals); hint-adjusted credit = credit × max(0.4, 1 − 0.15 × hints).
- **Mastery:** `m₁ = c₁`; `mₙ = mₙ₋₁ + 0.35 (cₙ − mₙ₋₁)`.
- **On track:** mastery ≥ 60% and state is Learning or Mastered.
- **Intervention:** active students on an outcome > 0 and on-track share < 50%.

## 10. Roadmap

1. Figure support (SVG/diagram upload) so IG figure questions can be adapted.
2. Dzongkha interface strings; low-bandwidth/offline practice (PWA with sync).
3. Teacher moderation queue for written answers with rubric overrides.
4. Item statistics (facility, discrimination) to retire weak items automatically.
5. Re-target to the KS5 2026–2030 framework when it is adopted (the outcome code scheme `CXII.EM.19` is already mapped in the analysis notes).
