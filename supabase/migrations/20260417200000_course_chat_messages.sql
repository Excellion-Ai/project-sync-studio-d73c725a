-- Persist course builder chat messages between sessions so coaches
-- keep context when they reopen a course.

create table if not exists public.course_chat_messages (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_chat_messages_course_created
  on public.course_chat_messages (course_id, created_at);

alter table public.course_chat_messages enable row level security;

-- Grants: authenticated needs CRUD, RLS gates to owner-only.
grant select, insert, update, delete on public.course_chat_messages to authenticated;

-- RLS: owner-only access.
create policy "Users can read their own chat messages"
  on public.course_chat_messages
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own chat messages"
  on public.course_chat_messages
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own chat messages"
  on public.course_chat_messages
  for delete
  to authenticated
  using (user_id = auth.uid());
