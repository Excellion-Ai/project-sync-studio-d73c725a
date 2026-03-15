# Excellion Course Generation Pipeline — Changes Summary

## Overview

Complete audit and rewrite of the AI-powered course generation system for Excellion, an online course builder platform for fitness influencers and coaches. All changes are on branch `claude/audit-course-prompts-K3LDY`.

---

## Architecture

```
User (Browser)
  |
  v
BuilderShell.tsx ──── Phase 1: Generate Outline ──────> ai.ts ──> Edge Function
  |                                                               (generate-course)
  |  <──── SSE: step, outline_ready ──────────────────────────────────┘
  |
  v  User reviews outline in preview panel
  |
  |  ── Phase 2: Approve & Generate Content ──> ai.ts ──> Edge Function
  |                                                       (generate-course)
  |  <──── SSE: step, outline, warning, metrics, complete ────────────┘
  |
  v
BuilderShell.tsx ──── Auto-save to Supabase DB
```

### Pipeline Steps (inside `generate-course` edge function)

```
Step 1: OUTLINE    ── Sonnet 4.5 (temp 0.4, 4096 tokens) ──> Course structure
                      Validates: title, description, modules, lessons, learning outcomes
                      On outlineOnly: returns here for user approval

Step 2: CONTENT    ── Sonnet 4.5 (temp 0.7, depth-based tokens) ──> Lesson content
                      Parallel: one API call per module
                      Validates: content_markdown word count, assignment briefs
                      Includes: structured fitness fields (exercise_demos, etc.)

Step 3: QUIZZES    ── Sonnet 4.5 (temp 0.3, 3072 tokens) ──> Quiz questions
                      Parallel: one API call per module with quiz lessons
                      Validates: question count, options, correct_index

Step 4: POLISH     ── Haiku 4.5 (temp 0.9, 2048 tokens) ──> Marketing copy
                      Non-critical: failures are logged, originals kept

Step 5: METRICS    ── Computed locally ──> Quality report
```

---

## Changes Made

### 1. Prompt Audit & Rewrite (Commit: `79736b2`)

**What changed:** All 7 edge function system prompts rewritten from generic to fitness-niche-specific.

**Files:**
- `supabase/functions/generate-course/index.ts` — Course generation prompts
- `supabase/functions/interpret-course-command/index.ts` — Command interpreter
- `supabase/functions/help-chat/index.ts` — Support chat
- `supabase/functions/bot-chat/index.ts` — Content strategist co-pilot
- `supabase/functions/builder-agent/index.ts` — Landing page architect
- `supabase/functions/code-agent/index.ts` — React code generator
- `supabase/functions/database-ai/index.ts` — Database schema architect

**Improvement:** Prompts now use coach-to-client voice, include fitness-specific examples (exercises, sets, reps, RPE), and produce content that's ready for real fitness courses instead of generic educational content.

### 2. API Parameter Optimization (Commit: `5967054`)

**What changed:** Temperature, max_tokens, and model selection tuned per task type.

| Step | Model | Temperature | Max Tokens |
|------|-------|-------------|------------|
| Outline | Sonnet 4.5 | 0.4 | 4,096 |
| Content | Sonnet 4.5 | 0.7 | 3,072-8,192 (depth-dependent) |
| Quizzes | Sonnet 4.5 | 0.3 | 3,072 |
| Polish | Haiku 4.5 | 0.9 | 2,048 |

**Improvement:** Previously all used API defaults (temp 1.0, single model). Now each step uses optimal settings — lower temp for structure/quizzes, higher for creative content/polish. Content generation parallelized across modules.

### 3. Multi-Step Streaming Pipeline (Commit: `5967054`)

**What changed:** Replaced single-shot API call with 4-step streaming pipeline using SSE.

**Improvement:** Users see real-time progress (step indicators), get outline preview before content fills in, and the pipeline can recover from individual step failures with fallback content.

### 4. Output Validation & Error Handling (Commit: `3246890`)

**What changed:** Added strict schema validators, retry logic, fallback content generators, and quality metrics.

**Components:**
- `validateOutline()` — Checks structure, titles, lesson counts, IDs
- `validateContent()` — Checks word counts, required fields
- `validateQuizzes()` — Checks question count, options, correct_index
- `validatePolish()` — Checks title/description types
- `callWithValidation()` — Retries up to 2x with validation errors injected into retry prompt
- `applyOutlineFallbacks()` / `applyContentFallbacks()` / `applyQuizFallbacks()` — Placeholder content for failed steps
- `computeMetrics()` — Logs word counts, quiz counts, timing, and empty fields

**Improvement:** Previously, malformed JSON or missing content silently produced broken courses. Now the pipeline validates at every step, retries with specific error feedback, and fills gaps with clearly-marked placeholders.

### 5. Course Depth Parameter (Commit: `046151a`)

**What changed:** New `CourseDepth` type: `overview`, `standard`, `deep_dive`.

| Depth | Lesson Duration | Min Words | Target Words | Content Tokens |
|-------|-----------------|-----------|--------------|----------------|
| Overview | ~5 min | 200 | 400 | 3,072 |
| Standard | ~15 min | 500 | 800 | 6,144 |
| Deep Dive | ~30 min | 1,000 | 1,500 | 8,192 |

**Files:** `CourseBuilderPanel.tsx`, `BuilderChatPanel.tsx`, `generate-course/index.ts`

**Improvement:** Users choose content depth upfront. Deep Dive courses get 3x more detailed lessons with advanced programming variables, case studies, and troubleshooting guides.

### 6. Structured Fitness Fields (Commit: `046151a`)

**What changed:** New TypeScript interfaces for structured fitness data attached to lessons.

**New interfaces in `src/types/course-pages.ts`:**
- `ExerciseDemo` — name, muscle_groups, sets, reps, tempo, rest, rpe, form_cues, common_mistakes, substitutions
- `WorkoutTemplate` — type (strength/hypertrophy/endurance/hiit/mobility/deload), warmup, exercises, cooldown
- `NutritionGuideline` — calories, protein_g, carbs_g, fat_g, meal_timing, sample_meals, supplements
- `ProgressMetric` — metric, how_to_measure, frequency, target
- `RecoveryProtocol` — type, description, frequency, duration

**Improvement:** Lessons now contain machine-readable fitness data alongside the markdown content. This enables future features like interactive workout cards, macro calculators, and progress tracking widgets.

### 7. Expertise Level Differentiation (Commit: `046151a`)

**What changed:** `EXPERTISE_MODIFIERS` in `generate-course/index.ts` provide genuinely different prompt instructions per level.

- **Beginner:** Simple language, bodyweight alternatives, hand-size portions, habit-focused
- **Intermediate:** Proper terminology, specific numbers (sets/reps/RPE), training splits, macros in grams
- **Advanced:** Undulating periodization, velocity-based training, carb cycling, HRV-guided training, research references

**Improvement:** Previously, difficulty was a surface-level word swap. Now it fundamentally changes the complexity, terminology, and programming concepts throughout the entire course.

### 8. Outline-First Approval Flow (Commit: `046151a`)

**What changed:** Two-phase generation: outline first, user approves, then full content.

**Flow:**
1. User clicks "Generate" → pipeline runs Step 1 only (`outlineOnly: true`)
2. Outline shown in preview panel for review/editing
3. User clicks "Approve & Generate Content" → pipeline runs Steps 2-4 using the approved outline (`approvedOutline`)
4. Course saved to database

**Files:** `BuilderShell.tsx` (state management), `BuilderChatPanel.tsx` (approval button), `ai.ts` (`generateFromOutlineStream`), `generate-course/index.ts` (`outlineOnly`/`approvedOutline` handling)

**Improvement:** Users can now review and edit the course structure before committing to full content generation, saving time and API credits.

### 9. Build Assist Niche Intelligence (Commit: `046151a`)

**What changed:** Optional `audience` and `niche` fields in course options.

- Niche (e.g., "powerlifting", "yoga", "functional fitness") tailors exercises, terminology, and examples
- Audience (e.g., "busy moms over 30", "competitive lifters") tailors language, scenarios, and pain points
- Both injected into all 4 prompt builders (outline, content, quiz, polish)

**Files:** `CourseBuilderPanel.tsx`, `BuilderChatPanel.tsx`, `generate-course/index.ts`

**Improvement:** Courses are now tailored to the creator's specific niche instead of generic "fitness."

### 10. Bug Fixes & Hardening (This commit)

- **Streaming error handling:** Error events now emitted to client before stream closes (was silently swallowed)
- **Validation threshold fix:** `validateContent` assignment_brief threshold corrected from 30 to 50 words
- **Duplicate [DONE] fix:** `bot-chat` no longer emits `[DONE]` twice
- **Fetch timeouts:** All 7 edge functions now have 2-minute `AbortSignal.timeout` on Anthropic API calls
- **`.env` security:** Untracked `.env` from git, added to `.gitignore`

---

## Test Generation Trace

**Input:** "8-week strength training program for beginners"
**Options:** `{ difficulty: "beginner", depth: "standard", duration_weeks: 8, includeQuizzes: true, includeAssignments: true, template: "creator" }`

### Phase 1: Outline Generation

1. `BuilderShell.handleGenerateCourse()` called with options
2. `AI.generateCourseStream()` sends POST to `generate-course` edge function with `{ prompt, options: { ...options, outlineOnly: true }, stream: true }`
3. Edge function enters streaming mode, calls `runPipeline()`
4. **Step 1 - Outline:**
   - Model: `claude-sonnet-4-5-20250929`, temp: `0.4`, tokens: `4096`
   - System prompt: `buildOutlinePrompt(options)` — includes `EXPERTISE_MODIFIERS.beginner` (simple language, bodyweight alternatives, hand-size portions)
   - User prompt includes: `Difficulty level: beginner`, `Content depth: standard`, `Target duration: 8 weeks`
   - Response validated by `validateOutline()` — checks title (5+ chars), description (20+ chars), modules (2+), lessons (2+ per module), learning outcomes (2+)
   - Fallbacks applied by `applyOutlineFallbacks()` for any missing fields
   - SSE events emitted: `step(structure: in_progress)`, `step(structure: complete)`, `outline_ready(course)`
5. Pipeline returns with `outlineOnly: true`
6. Frontend receives `outline_ready` event → sets `pendingOutline` state, shows "Approve & Generate Content" button

### Phase 2: Content Generation (after user approves)

1. `BuilderShell.handleApproveOutline()` called
2. `AI.generateFromOutlineStream()` sends POST with `{ prompt, options: { ...options, approvedOutline: outline }, stream: true }`
3. Edge function calls `runPipeline()` with `approvedOutline` — skips Step 1
4. **Step 2 - Content (parallel per module):**
   - Model: `claude-sonnet-4-5-20250929`, temp: `0.7`, tokens: `6144` (standard depth)
   - System prompt: `buildContentPrompt(options)` — includes beginner expertise modifiers, structured fitness field instructions, 500-word minimum per lesson
   - One `callWithValidation()` per module, all run in `Promise.all()`
   - Response validated by `validateContent()` — checks word counts (100+ min, 300+ warning), assignment briefs
   - Structured fitness fields merged: `exercise_demos`, `workout_template`, `nutrition_guidelines`, `progress_metrics`, `recovery_protocol`
   - Fallback content applied for any failed modules
5. **Step 3 - Quizzes (parallel per module):**
   - Model: `claude-sonnet-4-5-20250929`, temp: `0.3`, tokens: `3072`
   - System prompt: `buildQuizPrompt(options)` — beginner-level scenarios, simple language, avoid jargon
   - Validated by `validateQuizzes()` — 3+ questions per quiz, valid correct_index, proper types
   - Fallback quiz applied for empty quiz lessons
6. **Step 4 - Polish:**
   - Model: `claude-haiku-4-5-20251001`, temp: `0.9`, tokens: `2048`
   - Non-critical — failures logged, originals kept
7. **Metrics computed** — word counts, quiz counts, timing per step, empty field detection
8. SSE events: `metrics(qualityReport)`, `complete(fullCourse)`, `[DONE]`
9. Frontend saves to database via `saveCourseToDatabase()`

---

## Configuration Required

### Supabase Edge Function Secrets

| Secret | Required By | How to Set |
|--------|-------------|------------|
| `ANTHROPIC_API_KEY` | All 7 edge functions | Supabase Dashboard > Project Settings > Edge Functions > Secrets |

### Frontend Environment Variables

| Variable | Purpose | Set In |
|----------|---------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL | `.env` or hosting platform env vars |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `.env` or hosting platform env vars |

### Deployment

Edge functions deploy automatically when connected to Lovable via Supabase integration. If deploying manually:

```bash
supabase functions deploy generate-course
supabase functions deploy bot-chat
supabase functions deploy builder-agent
supabase functions deploy code-agent
supabase functions deploy database-ai
supabase functions deploy help-chat
supabase functions deploy interpret-course-command
```

---

## Edge Functions Reference

| Function | Model | Temp | Tokens | Purpose |
|----------|-------|------|--------|---------|
| `generate-course` | Sonnet 4.5 + Haiku 4.5 | 0.3-0.9 | 2048-8192 | Multi-step course generation pipeline |
| `bot-chat` | Haiku 4.5 | 0.7 | 2,048 | Streaming content strategist co-pilot |
| `builder-agent` | Sonnet 4.5 | 0.5 | 8,192 | Landing page blueprint generator |
| `code-agent` | Sonnet 4.5 | 0.2 | 8,192 | React component code generator |
| `database-ai` | Sonnet 4.5 | 0.1 | 4,096 | Database schema architect |
| `help-chat` | Haiku 4.5 | 0.5 | 2,048 | Support chat (non-streaming) |
| `interpret-course-command` | Sonnet 4.5 | 0.2 | 4,096 | Design/content command interpreter |

All functions have:
- 2-minute fetch timeout (`AbortSignal.timeout(120_000)`)
- CORS headers for cross-origin requests
- JSON error responses with proper HTTP status codes
- `ANTHROPIC_API_KEY` loaded from `Deno.env.get()`

---

## Known Limitations

1. **No actual test execution** — Edge functions require deployed Supabase + valid `ANTHROPIC_API_KEY` to test. The pipeline has been code-reviewed and type-checked but not end-to-end tested in this session.
2. **Large SSE payloads** — The `complete` event emits the entire course object in one SSE event, which could be large for deep-dive courses with many modules.
3. **No request rate limiting** — Multiple concurrent generations from the same user could hit Anthropic API rate limits.
4. **Refine tab is placeholder** — `handleRefine` shows a toast but doesn't actually regenerate content yet.
5. **Assistant prefill pattern** — The `{ role: "assistant", content: "{" }` technique for forcing JSON output is standard but could theoretically produce `{{...` on rare model edge cases.
