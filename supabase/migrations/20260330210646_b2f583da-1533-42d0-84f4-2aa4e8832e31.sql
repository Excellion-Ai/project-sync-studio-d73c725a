-- Re-grant column access (the REVOKE was too broad — owners need their own stripe IDs)
GRANT SELECT (stripe_account_id, stripe_price_id, stripe_product_id)
ON public.courses
TO anon, authenticated;