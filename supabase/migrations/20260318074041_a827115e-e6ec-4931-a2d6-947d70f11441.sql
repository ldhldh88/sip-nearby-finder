
-- Allow anon users to insert into bar_meta
DROP POLICY IF EXISTS "Authenticated users can insert bar_meta" ON public.bar_meta;
CREATE POLICY "Anyone can insert bar_meta"
  ON public.bar_meta FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anon users to update bar_meta
DROP POLICY IF EXISTS "Authenticated users can update bar_meta" ON public.bar_meta;
CREATE POLICY "Anyone can update bar_meta"
  ON public.bar_meta FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
