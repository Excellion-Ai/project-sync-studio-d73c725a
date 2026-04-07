# Excellion Security Audit Report

**Date**: 2026-04-01
**Status**: Pre-launch hardening complete

---

## 1. Secrets & API Keys

| Check | Result |
|---|---|
| `sk-ant-` (Anthropic secret) in codebase | PASS — not found |
| `sk_live` / `sk_test` (Stripe secrets) in codebase | PASS — not found |
| `service_role` hardcoded in frontend | PASS — only in Edge Functions via `Deno.env.get()` |
| `.env` file contains only public keys | PASS — anon key, hcaptcha site key, project URL |
| No `.env.local` or `.env.production` with secrets | PASS — only `.env` exists |
| No console.log leaking tokens/passwords | PASS — none found |
| No private keys or certificates in repo | PASS — none found |

### Where secrets are stored
- `ANTHROPIC_API_KEY` → Supabase Edge Function secrets (never in code)
- `STRIPE_SECRET_KEY` → Supabase Edge Function secrets (never in code)
- `STRIPE_WEBHOOK_SECRET` → Supabase Edge Function secrets (never in code)
- `SUPABASE_SERVICE_ROLE_KEY` → Auto-injected by Supabase into Edge Functions
- Frontend only uses: `VITE_SUPABASE_URL` (public) + `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key, public)

---

## 2. Row Level Security (RLS)

| Table | RLS | Policies | Status |
|---|---|---|---|
| courses | ON | 4 (INSERT own, SELECT own, SELECT published, UPDATE own) | SECURE |
| builder_projects | ON | 1 (ALL for own) | SECURE |
| enrollments | ON | 6 (INSERT checks user_id + free course, SELECT/UPDATE/DELETE own) | SECURE |
| subscriptions | ON | 4 (SELECT own, INSERT/UPDATE/DELETE denied) | HARDENED |
| purchases | ON | 4 (SELECT own, INSERT/UPDATE/DELETE denied) | HARDENED |
| creator_payouts | ON | 4 (SELECT own, INSERT/UPDATE/DELETE denied) | HARDENED |
| profiles | ON | 2 (ALL own, SELECT own) | SECURE |
| audit_log | ON | 3 (SELECT own, INSERT own, UPDATE/DELETE denied) | HARDENED |
| course_views | ON | 2 (INSERT for published courses, SELECT own analytics) | SECURE |
| course_versions | ON | 4 (CRUD scoped to course owner) | SECURE |
| course_chat_history | ON | 1 (ALL own) | SECURE |
| certificates | ON | 2 (INSERT/SELECT scoped) | SECURE |
| coupons | ON | 1 (ALL for creator) | SECURE |
| lesson_progress | ON | 1 (ALL via enrollment) | SECURE |
| lesson_resources | ON | 4 (CRUD scoped) | SECURE |
| lesson_views | ON | 2 (INSERT/SELECT scoped) | SECURE |
| quiz_attempts | ON | 1 (ALL via enrollment) | SECURE |
| student_profiles | ON | 1 (ALL own) | SECURE |
| leads | ON | 2 (INSERT with email validation, SELECT) | SECURE |
| waitlist | ON | 2 (INSERT with email validation, SELECT) | SECURE |
| layout_templates | ON | 1 (SELECT active only) | SECURE |
| published_sites | ON | 2 (ALL own, SELECT) | SECURE |
| domain_verifications | ON | 1 (ALL) | SECURE |
| stripe-connect | ON | 1 (SELECT for authenticated) | FIXED |

### Financial tables hardened
`subscriptions`, `purchases`, and `creator_payouts` are locked down:
- Users can only SELECT their own rows
- INSERT, UPDATE, DELETE are **denied** for all authenticated users
- Only `service_role` (via Edge Functions/webhooks) can modify these tables
- This prevents users from granting themselves subscriptions or fake purchases

---

## 3. Edge Function Security

| Function | Auth Required | Input Validation | Error Handling | CORS |
|---|---|---|---|---|
| generate-course | JWT ✓ | prompt required ✓ | try/catch ✓ | * |
| generate-lesson-content | JWT ✓ | auth check ✓ | try/catch ✓ | * |
| interpret-course-command | JWT ✓ | command required ✓ | try/catch ✓ | * |
| stripe-webhook | Stripe sig ✓ | sig verification ✓ | try/catch ✓ | * |
| create-portal-session | JWT ✓ | user lookup ✓ | try/catch ✓ | * |
| create-checkout | JWT ✓ | user + plan ✓ | try/catch ✓ | * |
| check-subscription | JWT ✓ | stripe key check ✓ | try/catch ✓ | * |
| verify-domain-dns | JWT ✓ | domain + courseId ✓ | try/catch ✓ | * |
| help-chat | JWT ✓ | auth check ✓ | try/catch ✓ | * |
| builder-agent | JWT ✓ | auth check ✓ | try/catch ✓ | * |

### No stack traces leaked
All Edge Functions catch errors and return generic messages. None expose `error.stack` to the frontend.

### No eval() or dynamic code execution
No `eval()`, `new Function()`, or `import()` with user-supplied strings found.

---

## 4. Frontend Security

| Check | Result |
|---|---|
| No `dangerouslySetInnerHTML` with user input | PASS — only used for static theme CSS |
| No `eval()` or `new Function()` | PASS |
| No secrets in localStorage | PASS — only Supabase session (standard) |
| Session tokens not in URLs | PASS |
| Protected routes require auth | PASS — AuthContext with loading state |
| Public routes work without auth | PASS — /course/:slug, landing, pricing |
| CSRF protection | PASS — Supabase uses bearer tokens, not cookies |

### Storage bucket policies
| Bucket | Public | Upload Policy |
|---|---|---|
| course-thumbnails | Yes (reads) | Authenticated users can upload/update/delete |
| course-resources | No | Scoped to course owner via course_id in path |

---

## 5. Stripe Payment Security

| Check | Result |
|---|---|
| Secret key only in Edge Functions | PASS |
| Webhook signature verification | PASS — `constructEvent()` with `STRIPE_WEBHOOK_SECRET` |
| Checkout amounts set server-side | PASS — prices are Stripe Price IDs, not client amounts |
| Subscription status from webhook, not client | PASS — `stripe-webhook` upserts to `subscriptions` |
| Users can't self-grant subscriptions | PASS — `deny_insert_subscriptions` policy |

---

## 6. Recommendations for Post-Launch

### HIGH Priority
1. **CORS**: Change `Access-Control-Allow-Origin: *` to `https://excellioncourses.com` on all Edge Functions once domain is stable
2. **Rate limiting**: Add rate limiting to `generate-course` and `interpret-course-command` (AI calls are expensive). Consider Supabase's built-in rate limiting or a counter in the database.
3. **Input size limits**: Add `Content-Length` check on Edge Functions — reject payloads over 100KB to prevent abuse of AI endpoints

### MEDIUM Priority
4. **File upload validation**: The attachment system accepts files up to 10MB. Consider scanning for malicious content or limiting to specific MIME types server-side
5. **CORS tightening for storage**: The `course-thumbnails` bucket allows any authenticated user to upload. Consider scoping uploads to `{user_id}/` prefix paths
6. **Session management**: Consider adding session timeout (currently unlimited) and concurrent session limits for premium accounts

### LOW Priority
7. **CSP headers**: Add Content-Security-Policy headers to prevent XSS from third-party scripts
8. **Audit logging**: The audit trigger logs course changes — consider adding audit logging for auth events (login, password change, email change)
9. **Monitoring**: Set up alerts for unusual patterns: many failed logins, bulk data exports, API key usage spikes
