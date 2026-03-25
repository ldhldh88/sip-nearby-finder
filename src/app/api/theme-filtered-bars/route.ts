import { prisma } from "@/lib/prisma";
import type { KakaoPlace } from "@/lib/kakao/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const themeId = url.searchParams.get("themeId");
  const districtName = url.searchParams.get("districtName");
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  if (!themeId || !districtName) {
    return Response.json({ places: [], themeMap: {} });
  }

  const hasPagination = limitParam !== null;
  const limit = hasPagination ? Math.max(1, Math.min(Number(limitParam), 50)) : null;
  const offset = hasPagination ? Math.max(0, Number(offsetParam ?? 0)) : 0;

  const location = districtName.split("/")[0]?.trim();
  if (!location) return Response.json({ places: [], themeMap: {} });

  // 1) Theme -> place ids
  const themePlaceRows = await prisma.barTheme.findMany({
    where: { theme_id: themeId },
    select: { kakao_place_id: true },
  });

  const placeIds = themePlaceRows.map((r) => r.kakao_place_id);
  if (placeIds.length === 0) return Response.json({ places: [], themeMap: {} });

  // 2) Match district id by ILIKE '%location%'
  const district = await prisma.district.findFirst({
    where: {
      name: {
        contains: location,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (!district) return Response.json({ places: [], themeMap: {} });

  // 3) Cached places in that district + matching ids
  const cachedWhere = { district_id: district.id, kakao_place_id: { in: placeIds } };

  const cached = await prisma.cachedPlace.findMany({
    where: cachedWhere,
    orderBy: { updated_at: "desc" },
    ...(hasPagination ? { skip: offset, take: limit } : {}),
    select: { kakao_place_id: true, place_data: true },
  });

  const places: KakaoPlace[] = cached.map(
    (c) => c.place_data as unknown as KakaoPlace
  );

  const themeMap: Record<string, string[]> = {};
  // Build theme map only for the returned (page) results.
  for (const c of cached) {
    themeMap[c.kakao_place_id] = [themeId];
  }

  if (!hasPagination) return Response.json({ places, themeMap });

  const total = await prisma.cachedPlace.count({ where: cachedWhere });
  return Response.json({ places, themeMap, total });
}

