
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text DEFAULT 'landing_page',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert to waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (email IS NOT NULL AND email <> '' AND email LIKE '%@%.%');
