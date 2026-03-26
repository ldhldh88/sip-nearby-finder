import { prisma } from "@/lib/prisma";
import type { NearbyRecommendKind } from "@/lib/nearby-recommend";
import type { KakaoPlace } from "@/lib/kakao/types";

interface BarMeta {
  like_count: number;
  view_count: number;
  bookmark_count: number;
  hot_score: number;
}

type Row = {
  kakao_place_id: string;
  place_data: unknown;
  like_count: number;
  view_count: number;
  bookmark_count: number;
  hot_score: number;
  dist_m: number;
};

/** ~meters per degree latitude */
const M_PER_DEG_LAT = 111_320;

function bboxPaddingDegrees(lat: number, radiusMeters: number): { dLat: number; dLng: number } {
  const pad = 1.02;
  const dLat = (radiusMeters * pad) / M_PER_DEG_LAT;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const denom = Math.max(M_PER_DEG_LAT * Math.abs(cosLat), 1e-6);
  const dLng = (radiusMeters * pad) / denom;
  return { dLat, dLng };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") ?? "");
  const lng = parseFloat(url.searchParams.get("lng") ?? "");
  const radiusRaw = parseFloat(url.searchParams.get("radiusMeters") ?? "1000");
  const radiusMeters = Number.isFinite(radiusRaw) ? radiusRaw : 1000;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "lat and lng are required as numbers" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json({ error: "lat/lng out of range" }, { status: 400 });
  }
  if (radiusMeters < 1 || radiusMeters > 50_000) {
    return Response.json({ error: "radiusMeters must be between 1 and 50000" }, { status: 400 });
  }

  const { dLat, dLng } = bboxPaddingDegrees(lat, radiusMeters);
  const minLat = lat - dLat;
  const maxLat = lat + dLat;
  const minLng = lng - dLng;
  const maxLng = lng + dLng;

  const rows = await prisma.$queryRaw<Row[]>`
    WITH dedup AS (
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
    ),
    scored AS (
      SELECT
        dedup.kakao_place_id,
        dedup.place_data,
        dedup.like_count,
        dedup.view_count,
        dedup.bookmark_count,
        dedup.hot_score,
        (
          6371000.0 * acos(
            LEAST(
              1.0::double precision,
              GREATEST(
                -1.0::double precision,
                cos(radians(${lat}::double precision))
                  * cos(radians((dedup.place_data->>'y')::double precision))
                  * cos(
                    radians((dedup.place_data->>'x')::double precision)
                    - radians(${lng}::double precision)
                  )
                  + sin(radians(${lat}::double precision))
                    * sin(radians((dedup.place_data->>'y')::double precision))
              )
            )
          )
        )::double precision AS dist_m
      FROM dedup
    )
    SELECT * FROM scored
    WHERE dist_m <= ${radiusMeters}::double precision
  `;

  if (rows.length === 0) {
    return Response.json({
      kind: "no_places" satisfies NearbyRecommendKind,
      places: [] as KakaoPlace[],
      metaMap: {} as Record<string, BarMeta>,
    });
  }

  const maxLike = Math.max(...rows.map((r) => r.like_count));
  if (maxLike <= 0) {
    return Response.json({
      kind: "no_metadata" satisfies NearbyRecommendKind,
      places: [] as KakaoPlace[],
      metaMap: {} as Record<string, BarMeta>,
    });
  }

  const winners = rows.filter((r) => r.like_count === maxLike);
  const places: KakaoPlace[] = [];
  const metaMap: Record<string, BarMeta> = {};

  for (const row of winners) {
    places.push(row.place_data as KakaoPlace);
    metaMap[row.kakao_place_id] = {
      like_count: row.like_count,
      view_count: row.view_count,
      bookmark_count: row.bookmark_count,
      hot_score: Number(row.hot_score),
    };
  }

  return Response.json({
    kind: "ok" satisfies NearbyRecommendKind,
    places,
    metaMap,
  });
}
