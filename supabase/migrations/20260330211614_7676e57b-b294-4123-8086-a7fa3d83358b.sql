-- Fix 1: Certificates INSERT policy - restrict to authenticated only
DROP POLICY IF EXISTS "users_insert_own_certificates" ON public.certificates;
CREATE POLICY "users_insert_own_certificates"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Fix 2: Certificates SELECT policy - restrict to authenticated only
DROP POLICY IF EXISTS "users_view_own_certificates" ON public.certificates;
CREATE POLICY "users_view_own_certificates"
ON public.certificates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());