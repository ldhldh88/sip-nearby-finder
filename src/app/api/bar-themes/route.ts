import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeIdsRaw = url.searchParams.get("placeIds") ?? "";

  const placeIds = placeIdsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (placeIds.length === 0) return Response.json({});

  const rows = await prisma.barTheme.findMany({
    where: { kakao_place_id: { in: placeIds } },
    select: { kakao_place_id: true, theme_id: true },
  });

  const map: Record<string, string[]> = {};
  for (const row of rows) {
    if (!map[row.kakao_place_id]) map[row.kakao_place_id] = [];
    map[row.kakao_place_id].push(row.theme_id);
  }

  return Response.json(map);
}

