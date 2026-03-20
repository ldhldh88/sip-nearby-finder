import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeIdsRaw = url.searchParams.get("placeIds") ?? "";

  const placeIds = placeIdsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (placeIds.length === 0) return Response.json({});

  const rows = await prisma.cachedPlace.findMany({
    where: { kakao_place_id: { in: placeIds } },
    select: {
      kakao_place_id: true,
      district_id: true,
      district: { select: { name: true } },
    },
  });

  const map: Record<string, { districtId: string; districtName: string }> = {};
  for (const row of rows) {
    map[row.kakao_place_id] = {
      districtId: row.district_id,
      districtName: row.district?.name ?? "",
    };
  }

  return Response.json(map);
}

