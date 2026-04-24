-- Founding Coach application flow.
-- Public form submissions, admin-only review.

create table if not exists public.founding_coach_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  instagram text,
  tiktok text,
  niche text not null,
  reason text not null check (length(reason) >= 20),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'waitlist'))
);

create index idx_founding_apps_email on public.founding_coach_applications (email);
create index idx_founding_apps_status on public.founding_coach_applications (status);

alter table public.founding_coach_applications enable row level security;

-- Anyone can submit an application (public form, no auth required).
create policy "Public insert" on public.founding_coach_applications
  for insert to anon, authenticated
  with check (true);

-- Only admins can read applications.
create policy "Admin select" on public.founding_coach_applications
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Only admins can update status.
create policy "Admin update" on public.founding_coach_applications
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (true);

-- Grant table-level privileges so RLS can actually run.
grant select, insert, update on public.founding_coach_applications to authenticated;
grant insert on public.founding_coach_applications to anon;
