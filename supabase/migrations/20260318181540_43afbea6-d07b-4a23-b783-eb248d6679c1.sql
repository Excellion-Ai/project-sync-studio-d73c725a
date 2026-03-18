DELETE FROM public.waitlist a USING public.waitlist b
WHERE a.id > b.id AND a.email = b.email;

ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_email_unique UNIQUE (email);