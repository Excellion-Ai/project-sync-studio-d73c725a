-- Fix 1: Remove overly permissive SELECT on stripe-connect table
DROP POLICY IF EXISTS "authenticated_read_stripe_connect" ON public."stripe-connect";

-- Fix 2: Replace overly permissive course-thumbnails UPDATE/DELETE policies with ownership-scoped ones
-- The upload path is: {userId}/{courseId}/filename
-- So foldername(name)[1] = userId

DROP POLICY IF EXISTS "authenticated_update_thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_thumbnails" ON storage.objects;

CREATE POLICY "owners_update_thumbnails" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'course-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "owners_delete_thumbnails" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'course-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);