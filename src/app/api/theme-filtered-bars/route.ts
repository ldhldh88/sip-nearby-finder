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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const themeId = url.searchParams.get("themeId");
  const districtName = url.searchParams.get("districtName");

  if (!themeId || !districtName) {
    return Response.json({ places: [], themeMap: {} });
  }

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
  const cached = await prisma.cachedPlace.findMany({
    where: { district_id: district.id, kakao_place_id: { in: placeIds } },
    select: { kakao_place_id: true, place_data: true },
  });

  const places: KakaoPlace[] = cached.map((c) => c.place_data as KakaoPlace);

  const themeMap: Record<string, string[]> = {};
  for (const id of placeIds) {
    if (!themeMap[id]) themeMap[id] = [];
    themeMap[id].push(themeId);
  }

  return Response.json({ places, themeMap });
}

