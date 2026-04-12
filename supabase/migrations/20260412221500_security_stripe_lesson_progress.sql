-- Security hardening: Stripe data exposure, lesson_progress self-certification, stripe-connect RLS
-- Applied: 2026-04-12

-- ============================================================
-- FIX 1: Strip Stripe columns from anon and authenticated roles
-- ============================================================
-- Problem: anon and authenticated had SELECT/INSERT/UPDATE on
-- stripe_account_id, stripe_price_id, stripe_product_id columns
-- on the courses table. Any unauthenticated user could read
-- Stripe account/product IDs from published courses.
--
-- Fix: Revoke all table-level grants, then re-grant column-by-column
-- excluding the three Stripe columns. service_role (Edge Functions)
-- retains full access for checkout flows.

REVOKE ALL ON public.courses FROM anon, authenticated;

GRANT SELECT (
  id, user_id, slug, subdomain, title, description, tagline, hero_copy,
  curriculum, branding, status, published_at, original_prompt, created_at,
  updated_at, thumbnail_url, price_cents, currency, instructor_name,
  instructor_bio, total_students, is_featured, builder_project_id,
  page_sections, custom_domain, domain_verified, seo_title, seo_description,
  social_image_url, has_video_content, type, meta, layout_template,
  design_config, section_order, section_config, deleted_at, is_free,
  domain_verification_token, domain_verified_at
) ON public.courses TO anon;

GRANT SELECT (
  id, user_id, slug, subdomain, title, description, tagline, hero_copy,
  curriculum, branding, status, published_at, original_prompt, created_at,
  updated_at, thumbnail_url, price_cents, currency, instructor_name,
  instructor_bio, total_students, is_featured, builder_project_id,
  page_sections, custom_domain, domain_verified, seo_title, seo_description,
  social_image_url, has_video_content, type, meta, layout_template,
  design_config, section_order, section_config, deleted_at, is_free,
  domain_verification_token, domain_verified_at
) ON public.courses TO authenticated;

GRANT INSERT (
  id, user_id, slug, subdomain, title, description, tagline, hero_copy,
  curriculum, branding, status, published_at, original_prompt,
  thumbnail_url, price_cents, currency, instructor_name,
  instructor_bio, total_students, is_featured, builder_project_id,
  page_sections, custom_domain, domain_verified, seo_title, seo_description,
  social_image_url, has_video_content, type, meta, layout_template,
  design_config, section_order, section_config, deleted_at, is_free,
  domain_verification_token, domain_verified_at
) ON public.courses TO authenticated;

GRANT UPDATE (
  slug, subdomain, title, description, tagline, hero_copy,
  curriculum, branding, status, published_at, original_prompt,
  thumbnail_url, price_cents, currency, instructor_name,
  instructor_bio, total_students, is_featured, builder_project_id,
  page_sections, custom_domain, domain_verified, seo_title, seo_description,
  social_image_url, has_video_content, type, meta, layout_template,
  design_config, section_order, section_config, deleted_at, is_free,
  domain_verification_token, domain_verified_at
) ON public.courses TO authenticated;

-- ============================================================
-- FIX 2: Remove students_track_progress policy from lesson_progress
-- ============================================================
-- Problem: The "students_track_progress" ALL policy let enrolled
-- students INSERT/UPDATE lesson_progress rows, allowing them to
-- self-certify lesson completion (set completed_at themselves).
--
-- Fix: Drop the ALL policy. The remaining policies correctly
-- restrict access:
--   - lesson_progress_users_read: SELECT for enrolled students
--   - lesson_progress_service_insert: INSERT for service_role only
--   - lesson_progress_service_update: UPDATE for service_role only

DROP POLICY IF EXISTS "students_track_progress" ON public.lesson_progress;

-- ============================================================
-- FIX 3: Add RLS policy for stripe-connect table
-- ============================================================
-- Problem: RLS was enabled but no policies existed, leaving the
-- table either fully locked out or wide open depending on context.
--
-- Fix: Only service_role can access this table.

DROP POLICY IF EXISTS "service_role_all_stripe_connect" ON public."stripe-connect";

CREATE POLICY "service_role_all_stripe_connect"
  ON public."stripe-connect"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
