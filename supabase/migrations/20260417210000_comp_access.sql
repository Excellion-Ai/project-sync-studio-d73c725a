-- Manual comp access: email allowlist that grants full platform access
-- without a paid Stripe subscription. Used for launch testers, founders,
-- partners, etc. The check-subscription Edge Function checks this table
-- BEFORE hitting Stripe and returns subscribed=true if the email matches.

create table if not exists public.comp_access (
  email text primary key,
  note text,
  granted_at timestamptz not null default now(),
  granted_by text
);

-- Server-only: block all client access via empty RLS. The Edge Function
-- uses the service_role key, which bypasses RLS, so it can still read.
alter table public.comp_access enable row level security;

-- No grants to anon/authenticated — only service_role (default) can read.
revoke all on public.comp_access from anon, authenticated;
