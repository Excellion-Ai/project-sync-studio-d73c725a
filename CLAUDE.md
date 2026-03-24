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
- src/lib/coursePersistence.ts — Database save logic
- src/pages/SecretBuilder.tsx — Main builder page

## Before Every Commit
- Search for exposed keys (sk-ant-, sk_live, service_role)
- Verify all saves have error handling
- Test that RLS policies allow intended operations
- Ensure Edge Functions have CORS headers
