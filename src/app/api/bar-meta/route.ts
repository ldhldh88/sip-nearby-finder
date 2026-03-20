import { prisma } from "@/lib/prisma";

interface BarMeta {
  like_count: number;
  view_count: number;
  bookmark_count: number;
  hot_score: number;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeIdsRaw = url.searchParams.get("placeIds") ?? "";

  const placeIds = placeIdsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (placeIds.length === 0) return Response.json({});

  const rows = await prisma.barMeta.findMany({
    where: { kakao_place_id: { in: placeIds } },
    select: {
      kakao_place_id: true,
      like_count: true,
      view_count: true,
      bookmark_count: true,
      hot_score: true,
    },
  });

  const map: Record<string, BarMeta> = {};
  for (const row of rows) {
    map[row.kakao_place_id] = {
      like_count: row.like_count,
      view_count: row.view_count,
      bookmark_count: row.bookmark_count,
      hot_score: row.hot_score,
    };
  }

  return Response.json(map);
}

