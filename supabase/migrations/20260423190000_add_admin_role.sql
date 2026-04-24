-- Add 'admin' to the profiles role check constraint.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role is null or role in ('coach', 'student', 'admin'));
