import { prisma } from "@/lib/prisma";

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

interface BarMeta {
  like_count: number;
  view_count: number;
  bookmark_count: number;
  hot_score: number;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const districtName = url.searchParams.get("districtName");

  if (!districtName) {
    return Response.json({ places: [], metaMap: {} });
  }

  // Calls the Postgres function `get_district_bars(p_district_name text)`.
  const rows = await prisma.$queryRaw<
    Array<{
      kakao_place_id: string;
      place_data: unknown;
      like_count: number;
      view_count: number;
      bookmark_count: number;
      hot_score: number;
    }>
  >`SELECT * FROM public.get_district_bars(${districtName});`;

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

  return Response.json({ places, metaMap });
}

