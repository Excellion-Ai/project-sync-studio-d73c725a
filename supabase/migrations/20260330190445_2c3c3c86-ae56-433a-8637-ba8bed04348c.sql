-- 1. Fix: leads table - add explicit deny-all SELECT policy
CREATE POLICY "deny_select_leads"
  ON public.leads FOR SELECT
  TO public
  USING (false);

-- 2. Fix: waitlist table - add explicit deny-all SELECT policy  
CREATE POLICY "deny_select_waitlist"
  ON public.waitlist FOR SELECT
  TO public
  USING (false);

-- 3. Fix: course-resources storage - tighten upload policy to course owners
DROP POLICY IF EXISTS "creators_upload_resources" ON storage.objects;
CREATE POLICY "creators_upload_resources"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'course-resources'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.user_id = auth.uid()
        AND c.id::text = (storage.foldername(name))[1]
    )
  );

-- Fix: course-resources storage - tighten delete policy to course owners
DROP POLICY IF EXISTS "creators_delete_resources" ON storage.objects;
CREATE POLICY "creators_delete_resources"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'course-resources'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.user_id = auth.uid()
        AND c.id::text = (storage.foldername(name))[1]
    )
  );