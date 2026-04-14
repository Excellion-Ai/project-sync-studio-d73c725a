-- Add role column to profiles for coach/student routing
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text
    CHECK (role IS NULL OR role IN ('coach', 'student'));

-- Existing RLS policy "users_manage_own_profile" (ALL command, id = auth.uid())
-- already allows users to UPDATE their own role, so no new policy is needed.

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role) WHERE role IS NOT NULL;
