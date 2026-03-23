import { prisma } from "@/lib/prisma";
import type { KakaoPlace } from "@/lib/kakao/types";

interface BarMeta {
  like_count: number;
  view_count: number;
  bookmark_count: number;
  hot_score: number;
}

const MAX_LAT_SPAN = 0.85;
const MAX_LNG_SPAN = 1.15;
const RESULT_LIMIT = 500;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const swLat = parseFloat(url.searchParams.get("swLat") ?? "");
  const swLng = parseFloat(url.searchParams.get("swLng") ?? "");
  const neLat = parseFloat(url.searchParams.get("neLat") ?? "");
  const neLng = parseFloat(url.searchParams.get("neLng") ?? "");
  const themeIdRaw = url.searchParams.get("themeId");

  if ([swLat, swLng, neLat, neLng].some((n) => Number.isNaN(n))) {
    return Response.json({ error: "swLat, swLng, neLat, neLng are required as numbers" }, { status: 400 });
  }

  const minLat = Math.min(swLat, neLat);
  const maxLat = Math.max(swLat, neLat);
  const minLng = Math.min(swLng, neLng);
  const maxLng = Math.max(swLng, neLng);

  if (maxLat - minLat > MAX_LAT_SPAN || maxLng - minLng > MAX_LNG_SPAN) {
    return Response.json({ error: "viewport span too large" }, { status: 400 });
  }

  let themeId: string | null = null;
  if (themeIdRaw) {
    if (!UUID_RE.test(themeIdRaw)) {
      return Response.json({ error: "invalid themeId" }, { status: 400 });
    }
    themeId = themeIdRaw;
  }

  type Row = {
    kakao_place_id: string;
    place_data: unknown;
    like_count: number;
    view_count: number;
    bookmark_count: number;
    hot_score: number;
  };

  const rows = themeId
    ? await prisma.$queryRaw<Row[]>`
        SELECT * FROM (
          SELECT DISTINCT ON (cp.kakao_place_id)
            cp.kakao_place_id,
            cp.place_data,
            COALESCE(bm.like_count, 0)::int AS like_count,
            COALESCE(bm.view_count, 0)::int AS view_count,
            COALESCE(bm.bookmark_count, 0)::int AS bookmark_count,
            COALESCE(bm.hot_score, 0)::numeric AS hot_score
          FROM cached_places cp
          INNER JOIN bar_themes bt
            ON bt.kakao_place_id = cp.kakao_place_id
            AND bt.theme_id = ${themeId}::uuid
          LEFT JOIN bar_meta bm ON cp.kakao_place_id = bm.kakao_place_id
          WHERE (cp.place_data->>'y')::double precision >= ${minLat}
            AND (cp.place_data->>'y')::double precision <= ${maxLat}
            AND (cp.place_data->>'x')::double precision >= ${minLng}
            AND (cp.place_data->>'x')::double precision <= ${maxLng}
          ORDER BY cp.kakao_place_id, COALESCE(bm.hot_score, 0) DESC
        ) sub
        ORDER BY
          sub.hot_score * 10 + sub.like_count * 3 + sub.bookmark_count * 2 + sub.view_count * 0.1 DESC
        LIMIT ${RESULT_LIMIT}
      `
    : await prisma.$queryRaw<Row[]>`
        SELECT * FROM (
          SELECT DISTINCT ON (cp.kakao_place_id)
            cp.kakao_place_id,
            cp.place_data,
            COALESCE(bm.like_count, 0)::int AS like_count,
            COALESCE(bm.view_count, 0)::int AS view_count,
            COALESCE(bm.bookmark_count, 0)::int AS bookmark_count,
            COALESCE(bm.hot_score, 0)::numeric AS hot_score
          FROM cached_places cp
          LEFT JOIN bar_meta bm ON cp.kakao_place_id = bm.kakao_place_id
          WHERE (cp.place_data->>'y')::double precision >= ${minLat}
            AND (cp.place_data->>'y')::double precision <= ${maxLat}
            AND (cp.place_data->>'x')::double precision >= ${minLng}
            AND (cp.place_data->>'x')::double precision <= ${maxLng}
          ORDER BY cp.kakao_place_id, COALESCE(bm.hot_score, 0) DESC
        ) sub
        ORDER BY
          sub.hot_score * 10 + sub.like_count * 3 + sub.bookmark_count * 2 + sub.view_count * 0.1 DESC
        LIMIT ${RESULT_LIMIT}
      `;

  const places: KakaoPlace[] = [];
  const metaMap: Record<string, BarMeta> = {};

  for (const row of rows) {
    places.push(row.place_data as KakaoPlace);
    metaMap[row.kakao_place_id] = {
      like_count: row.like_count,
      view_count: row.view_count,
      bookmark_count: row.bookmark_count,
      hot_score: Number(row.hot_score),
    };
  }

  return Response.json({ places, metaMap });
}
