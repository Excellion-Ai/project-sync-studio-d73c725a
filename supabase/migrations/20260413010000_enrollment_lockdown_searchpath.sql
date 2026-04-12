-- Security: enrollments self-certification + function search_path
-- Applied: 2026-04-13

-- ============================================================
-- FIX 1: Restrict enrollments UPDATE columns
-- ============================================================
-- Problem: students_update_own_enrollments policy lets authenticated
-- users UPDATE any column on their enrollment rows, including
-- completed_at and progress_percent — enabling self-certification.
--
-- Fix: Revoke table-level UPDATE, re-grant only safe UX columns.
-- service_role retains full access for server-side progress tracking.

REVOKE UPDATE ON public.enrollments FROM authenticated;

GRANT UPDATE (last_lesson_id, last_accessed_at)
  ON public.enrollments TO authenticated;

-- ============================================================
-- FIX 2: Set search_path on cleanup_old_rate_limits
-- ============================================================
-- All other public functions already have search_path=public.
-- This was the only one missing, which is a mutable search_path vuln.

ALTER FUNCTION public.cleanup_old_rate_limits()
  SET search_path = public;
