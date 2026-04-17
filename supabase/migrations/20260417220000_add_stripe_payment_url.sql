-- Add Stripe Payment Link URL to courses.
-- Coaches paste a Stripe-hosted Payment Link (https://buy.stripe.com/...)
-- and when a student clicks Enroll Now, they're redirected to it.
-- This is additive — does not touch the existing Stripe Connect checkout
-- flow used by platform-managed pricing.

alter table public.courses
  add column if not exists stripe_payment_url text;
