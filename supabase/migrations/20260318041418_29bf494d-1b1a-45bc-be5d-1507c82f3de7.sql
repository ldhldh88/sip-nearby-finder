
-- 1. bar_meta: 유저 생성 집계 데이터
CREATE TABLE public.bar_meta (
  kakao_place_id TEXT PRIMARY KEY,
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  bookmark_count INT NOT NULL DEFAULT 0,
  hot_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bar_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bar_meta"
  ON public.bar_meta FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bar_meta"
  ON public.bar_meta FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bar_meta"
  ON public.bar_meta FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. themes: 테마 목록
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read themes"
  ON public.themes FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. bar_themes: 가게-테마 M:N
CREATE TABLE public.bar_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kakao_place_id TEXT NOT NULL REFERENCES public.bar_meta(kakao_place_id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kakao_place_id, theme_id, user_id)
);

ALTER TABLE public.bar_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bar_themes"
  ON public.bar_themes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own bar_themes"
  ON public.bar_themes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bar_themes"
  ON public.bar_themes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. bookmarks: 유저 북마크
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_place_id TEXT NOT NULL REFERENCES public.bar_meta(kakao_place_id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, kakao_place_id, theme_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
