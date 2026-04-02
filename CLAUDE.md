# Excellion Course Builder

## What This Project Is
Excellion is an AI-powered course site builder platform targeting fitness influencers and coaches. Users describe a course idea, AI generates the structure/framework, and creators customize it with their own content (videos, text, images). Each course publishes as its own mini-website.

## Tech Stack
- Frontend: React + TypeScript + Tailwind (built with Lovable)
- Backend: Supabase (Postgres, Auth, Edge Functions, Storage)
- Payments: Stripe Connect (revenue sharing)
- AI: Anthropic Claude API (via Edge Functions)
- Domain: excellioncourses.com

## Critical Rules
1. NEVER put secret keys in frontend code
2. NEVER modify src/integrations/ — it has the correct Supabase connection
3. ALWAYS use RLS policies on every table
4. ALWAYS save in order: course → modules → lessons → quizzes
5. ALWAYS handle errors with user-facing toast notifications
6. Edge Functions must complete in under 25 seconds
7. AI generates STRUCTURE only, not full lesson content

## Supabase Project
- Project ID: vyppeqwxwzrtystobfch
- API key env var: ANTHROPIC_API_KEY
- Auth: email/password via Supabase Auth

## Key Directories
- supabase/functions/ — Edge Functions (Deno)
- src/components/builder/ — Course builder UI
- src/components/secret-builder/ — Advanced builder components
- src/components/secret-builder/CourseLandingPreview.tsx — THE single renderer for both builder + published page
- src/components/secret-builder/visual-editing/DynamicCoursePreview.tsx — CSS variable injection wrapper
- src/lib/coursePersistence.ts — Database save logic
- src/pages/SecretBuilder.tsx — Main builder page
- src/pages/CoursePage.tsx — Published course page (uses DynamicCoursePreview + .dark override)

## Published Course Architecture
- Route: /course/:slug
- Published page uses DynamicCoursePreview → CourseLandingPreview (SAME as builder)
- useOverrideDarkTheme() hook injects .dark {} CSS override into document.head
- Lookup priority: slug → subdomain → UUID
- Owner can view drafts at the same URL (yellow preview banner)
- Clean slug generated from title (no random suffixes)

## URL System
- Published: excellioncourses.com/course/{clean-slug}
- Custom domain (future): https://{custom_domain} (if verified)
- Slug generation: generate_clean_slug() SQL function, auto-dedup with -2, -3 etc.

## Database Triggers (All Failure-Tolerant)
- audit_course_changes: Logs changes to audit_log (EXCEPTION wrapped)
- snapshot_course_before_update: Saves version history (EXCEPTION wrapped)
- enforce_soft_delete_courses: Converts DELETE to soft-delete (EXCEPTION wrapped)
- update_subscriptions_updated_at: Auto-updates timestamp

## Before Every Commit
- Search for exposed keys (sk-ant-, sk_live, service_role)
- Verify all saves have error handling
- Test that RLS policies allow intended operations
- Ensure Edge Functions have CORS headers
- Merge main if branch is behind (PreToolUse hook does this automatically for git push)
