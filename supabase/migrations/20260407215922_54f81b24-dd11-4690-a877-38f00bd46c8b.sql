-- Fix 1: Drop audit_log INSERT policy to prevent log poisoning
-- The audit_course_changes trigger uses SECURITY DEFINER so it bypasses RLS
DROP POLICY IF EXISTS "allow_trigger_insert_audit_log" ON public.audit_log;

-- Fix 2: Drop overly permissive stripe-connect read policy
DROP POLICY IF EXISTS "authenticated_read_stripe_connect" ON public."stripe-connect";

-- Fix 3: Fix course-thumbnails storage policies to scope to owner
DROP POLICY IF EXISTS "authenticated_update_thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own course thumbnails" ON storage.objects;

CREATE POLICY "creators_update_own_thumbnails" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'course-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "creators_delete_own_thumbnails" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'course-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);