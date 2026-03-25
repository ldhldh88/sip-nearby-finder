import { prisma } from "@/lib/prisma";
import type { KakaoPlace } from "@/lib/kakao/types";

interface BarMeta {
  like_count: number;
  view_count: number;
  bookmark_count: number;
  hot_score: number;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const districtName = url.searchParams.get("districtName");
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  if (!districtName) {
    return Response.json({ places: [], metaMap: {} });
  }

  const hasPagination = limitParam !== null;
  const limit = hasPagination ? Math.max(1, Math.min(Number(limitParam), 50)) : null;
  const offset = hasPagination ? Math.max(0, Number(offsetParam ?? 0)) : 0;

  // Calls the Postgres function `get_district_bars(p_district_name text)`.
  let rows = [] as Array<{
    kakao_place_id: string;
    place_data: unknown;
    like_count: number;
    view_count: number;
    bookmark_count: number;
    hot_score: number;
  }>;

  if (hasPagination) {
    rows = await prisma.$queryRaw<
      Array<{
        kakao_place_id: string;
        place_data: unknown;
        like_count: number;
        view_count: number;
        bookmark_count: number;
        hot_score: number;
      }>
    >`SELECT * FROM public.get_district_bars(${districtName}) LIMIT ${limit} OFFSET ${offset};`;
  } else {
    rows = await prisma.$queryRaw<
      Array<{
        kakao_place_id: string;
        place_data: unknown;
        like_count: number;
        view_count: number;
        bookmark_count: number;
        hot_score: number;
      }>
    >`SELECT * FROM public.get_district_bars(${districtName});`;
  }

  const places: KakaoPlace[] = [];
  const metaMap: Record<string, BarMeta> = {};

  for (const row of rows) {
    places.push(row.place_data as KakaoPlace);
    metaMap[row.kakao_place_id] = {
      like_count: row.like_count,
      view_count: row.view_count,
      bookmark_count: row.bookmark_count,
      hot_score: row.hot_score,
    };
  }

  if (!hasPagination) return Response.json({ places, metaMap });

  const countRows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*)::int as total FROM public.get_district_bars(${districtName});
  `;
  const total = Number(countRows?.[0]?.total ?? 0);

  return Response.json({ places, metaMap, total });
}

