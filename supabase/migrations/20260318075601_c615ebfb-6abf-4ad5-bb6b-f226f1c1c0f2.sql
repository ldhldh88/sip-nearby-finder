
CREATE OR REPLACE FUNCTION public.get_district_bars(p_district_name text)
RETURNS TABLE (
  kakao_place_id text,
  place_data jsonb,
  like_count integer,
  view_count integer,
  bookmark_count integer,
  hot_score numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    cp.kakao_place_id,
    cp.place_data,
    COALESCE(bm.like_count, 0) AS like_count,
    COALESCE(bm.view_count, 0) AS view_count,
    COALESCE(bm.bookmark_count, 0) AS bookmark_count,
    COALESCE(bm.hot_score, 0) AS hot_score
  FROM cached_places cp
  INNER JOIN districts d ON cp.district_id = d.id
  LEFT JOIN bar_meta bm ON cp.kakao_place_id = bm.kakao_place_id
  WHERE d.name ILIKE '%' || split_part(p_district_name, '/', 1) || '%'
  ORDER BY
    COALESCE(bm.hot_score, 0) * 10
    + COALESCE(bm.like_count, 0) * 3
    + COALESCE(bm.bookmark_count, 0) * 2
    + COALESCE(bm.view_count, 0) * 0.1
    DESC;
$$;
