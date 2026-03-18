
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
    sub.kakao_place_id,
    sub.place_data,
    sub.like_count,
    sub.view_count,
    sub.bookmark_count,
    sub.hot_score
  FROM (
    SELECT DISTINCT ON (cp.kakao_place_id)
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
    ORDER BY cp.kakao_place_id
  ) sub
  ORDER BY
    sub.hot_score * 10
    + sub.like_count * 3
    + sub.bookmark_count * 2
    + sub.view_count * 0.1
    DESC;
$$;
