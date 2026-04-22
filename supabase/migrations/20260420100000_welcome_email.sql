-- Welcome email infrastructure: email_log table with full audit trail.
-- Replaces the earlier minimal version with proper status tracking,
-- Resend ID storage, user-readable RLS, and rate-limit support.

drop trigger if exists on_profile_created_send_welcome on public.profiles;
drop function if exists public.trigger_welcome_email();
drop table if exists public.email_log;

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email_address text not null,
  email_type text not null,
  subject text,
  sent_at timestamptz default now(),
  status text check (status in ('sent', 'failed')),
  resend_id text,
  error_message text,
  created_at timestamptz default now()
);

create index idx_email_log_user_id on public.email_log(user_id);
create index idx_email_log_email_type on public.email_log(email_type);
create index idx_email_log_sent_at on public.email_log(sent_at);

alter table public.email_log enable row level security;

create policy "Service role full access" on public.email_log
  for all to service_role using (true) with check (true);

create policy "Users read own email log" on public.email_log
  for select to authenticated using (auth.uid() = user_id);
