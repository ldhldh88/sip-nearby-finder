-- bar_themes: 로그인 없이 로컬 UUID로 테마를 붙이는 흐름 + Prisma/풀러 연결에서 RLS 통과
-- 기존: INSERT/DELETE 가 authenticated + auth.uid() = user_id 만 허용 → 익명 UUID는 항상 실패

DROP POLICY IF EXISTS "Users can insert own bar_themes" ON public.bar_themes;
DROP POLICY IF EXISTS "Users can delete own bar_themes" ON public.bar_themes;
DROP POLICY IF EXISTS "Anyone can insert bar_themes" ON public.bar_themes;
DROP POLICY IF EXISTS "Anyone can delete bar_themes" ON public.bar_themes;

CREATE POLICY "Anyone can insert bar_themes"
  ON public.bar_themes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete bar_themes"
  ON public.bar_themes
  FOR DELETE
  TO anon, authenticated
  USING (true);
