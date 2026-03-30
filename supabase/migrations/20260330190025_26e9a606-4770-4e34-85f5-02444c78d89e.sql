-- 1. Fix: Stripe Connect data exposed to all authenticated users
DROP POLICY IF EXISTS "authenticated_read_stripe_connect" ON public."stripe-connect";

-- 2. Fix: Any user can self-enroll in paid courses without payment
DROP POLICY IF EXISTS "students_manage_enrollments" ON public.enrollments;

CREATE POLICY "students_read_own_enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "students_update_own_enrollments"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "students_enroll_free_courses"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
        AND c.deleted_at IS NULL
        AND (c.is_free = true OR c.price_cents IS NULL OR c.price_cents = 0)
    )
  );

CREATE POLICY "students_delete_own_enrollments"
  ON public.enrollments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Fix: Soft-deleted courses remain publicly visible
DROP POLICY IF EXISTS "anyone_views_published" ON public.courses;

CREATE POLICY "anyone_views_published"
  ON public.courses FOR SELECT
  TO public
  USING (status = 'published' AND deleted_at IS NULL);

-- 4. Fix: Function search_path mutable
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;