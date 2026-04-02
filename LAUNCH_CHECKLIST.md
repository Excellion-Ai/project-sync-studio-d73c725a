# Launch Checklist — Excellion Course Builder

## Audit Summary (Last updated: 2026-04-01)

### Fixes Applied

#### Database
- [x] Removed 5 duplicate RLS policies on `courses` table (kept 4 clean ones: INSERT, SELECT own, SELECT published, UPDATE own)
- [x] Added SELECT policy to `stripe-connect` table (had RLS enabled with 0 policies — blocked all access)
- [x] Added index `idx_courses_slug` for slug lookups on published pages
- [x] Added index `idx_course_views_course_id` for analytics queries
- [x] Added index `idx_enrollments_user_course` for enrollment lookups
- [x] Clean slug system: `generate_clean_slug()` SQL function removes random suffixes
- [x] Partial unique index `idx_courses_one_active_per_project` prevents duplicate courses per project
- [x] Audit triggers wrapped in EXCEPTION blocks — never block course saves
- [x] `audit_log.record_id` changed from uuid to text (was causing type mismatch)
- [x] `audit_log` INSERT RLS policy added (was missing, blocking all course saves)

#### Edge Functions
- [x] `generate-course`: Timeout reduced from 50s to 20s, max_tokens from 3000 to 1500
- [x] `generate-lesson-content`: Lightweight helper for lesson descriptions
- [x] `interpret-course-command`: AI-powered course editing via chat
- [x] `stripe-webhook`: Syncs subscription state from Stripe
- [x] `create-portal-session`: Opens Stripe Customer Portal
- [x] `create-checkout`: Creates Stripe checkout session
- [x] `check-subscription`: Checks subscription status via Stripe API
- [x] `verify-domain-dns`: Verifies custom domain DNS via Cloudflare DoH

#### Frontend
- [x] Subscription polling changed from 60s interval to window-focus-based (stops 404 spam)
- [x] Published course page uses `DynamicCoursePreview` (same component as builder)
- [x] `.dark` CSS override via `useOverrideDarkTheme()` hook for course colors
- [x] Course save with auto-retry and bulletproof error handling
- [x] Auto-save skips during publish to prevent race conditions
- [x] Clean slug URLs: `/course/{clean-slug}` format
- [x] Preview link shown in builder header immediately after course save

#### Auth
- [x] Supabase client: `persistSession: true`, `autoRefreshToken: true`
- [x] `detectSessionInUrl` defaults to true in Supabase JS v2 (password reset works)
- [x] Auth context: `onAuthStateChange` + `getSession()` with loading state
- [x] Protected routes wait for auth to initialize

#### Security
- [x] No exposed keys in codebase (sk-ant-, sk_live, service_role)
- [x] RLS enabled on all 24 public tables
- [x] All Edge Functions have CORS headers and error handling
- [x] Stripe webhook signature verification in place
- [x] Frontend uses only anon key (never service_role)

---

### Edge Functions

| Function | Purpose | JWT Required | Timeout |
|---|---|---|---|
| `generate-course` | AI course outline generation | Yes | 20s |
| `generate-lesson-content` | AI lesson description generation | Yes | 10s |
| `interpret-course-command` | AI-powered course editing via chat | Yes | 45s |
| `stripe-webhook` | Syncs Stripe subscription events | No (Stripe sig) | 25s |
| `create-portal-session` | Opens Stripe billing portal | Yes | 10s |
| `create-checkout` | Creates Stripe checkout session | Yes | 10s |
| `check-subscription` | Checks subscription status | Yes | 10s |
| `verify-domain-dns` | Verifies custom domain DNS records | Yes | 10s |
| `help-chat` | Help/support chat AI | Yes | 45s |
| `bot-chat` | General chatbot AI | Yes | 45s |
| `builder-agent` | AI builder assistant | Yes | 45s |
| `code-agent` | AI code assistant | Yes | 45s |
| `database-ai` | AI database assistant | Yes | 45s |
| `waitlist-welcome` | Sends welcome email to waitlist | No | 10s |

### Database Tables

| Table | RLS | Policies | Purpose |
|---|---|---|---|
| `courses` | Yes | 4 | Course data (curriculum, design, pricing) |
| `builder_projects` | Yes | 1 | Links courses to builder sessions |
| `course_versions` | Yes | 4 | Version history snapshots |
| `course_views` | Yes | 2 | Page view analytics |
| `course_chat_history` | Yes | 1 | Chat messages in builder |
| `enrollments` | Yes | 6 | Student enrollments |
| `lesson_progress` | Yes | 1 | Student progress tracking |
| `lesson_views` | Yes | 2 | Lesson view analytics |
| `lesson_resources` | Yes | 4 | Downloadable resources |
| `quiz_attempts` | Yes | 1 | Quiz answers/scores |
| `certificates` | Yes | 2 | Completion certificates |
| `profiles` | Yes | 2 | User profiles |
| `student_profiles` | Yes | 1 | Student-specific profiles |
| `subscriptions` | Yes | 4 | Stripe subscription data |
| `purchases` | Yes | 4 | Course purchases |
| `coupons` | Yes | 1 | Discount coupons |
| `creator_payouts` | Yes | 4 | Creator payout tracking |
| `leads` | Yes | 2 | Lead capture |
| `waitlist` | Yes | 2 | Waitlist signups |
| `audit_log` | Yes | 3 | Course change audit trail |
| `layout_templates` | Yes | 1 | Course layout templates |
| `published_sites` | Yes | 2 | Published site metadata |
| `domain_verifications` | Yes | 1 | Domain DNS verification |
| `stripe-connect` | Yes | 1 | Stripe Connect data |

### Environment Variables / Secrets

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend (.env) | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend (.env) | Supabase anon key |
| `ANTHROPIC_API_KEY` | Edge Function secrets | Claude API key |
| `STRIPE_SECRET_KEY` | Edge Function secrets | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Edge Function secrets | Stripe webhook signing secret |
| `SUPABASE_URL` | Edge Function (auto) | Provided by Supabase |
| `SUPABASE_ANON_KEY` | Edge Function (auto) | Provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function (auto) | Provided by Supabase |

### End-to-End Test Steps

1. **Sign up**: Create account → verify email → redirected to builder
2. **Generate course**: Type topic → click Generate → see progress → course appears
3. **Edit course**: Change title → change colors → add hero image → auto-saves
4. **Preview**: Click Preview in header → opens new tab → course renders with correct theme
5. **Publish**: Click Publish → course URL shown → copy URL → visit URL → course visible
6. **Enroll**: Visit published URL → click Enroll → enrolled → redirect to learning page
7. **Subscribe**: Go to Billing → click Subscribe → Stripe checkout → subscription active
8. **Custom domain**: Go to Publish Settings → Domain tab → add domain → DNS instructions shown
