import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * 동네 미지정 술집을 선택한 구역 캐시에 등록 (구 Supabase add-place-to-cache)
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const districtId = String((body as { district_id?: unknown }).district_id ?? "");
  const kakaoPlaceId = String((body as { kakao_place_id?: unknown }).kakao_place_id ?? "");
  const placeData = (body as { place_data?: unknown }).place_data;

  if (!districtId || !kakaoPlaceId || placeData === undefined || placeData === null) {
    return Response.json(
      { error: "district_id, kakao_place_id, place_data are required" },
      { status: 400 }
    );
  }

  const district = await prisma.district.findUnique({
    where: { id: districtId },
    select: { id: true, name: true },
  });

  if (!district) {
    return Response.json({ error: "District not found" }, { status: 404 });
  }

  await prisma.cachedPlace.upsert({
    where: {
      district_id_kakao_place_id: {
        district_id: districtId,
        kakao_place_id: kakaoPlaceId,
      },
    },
    create: {
      district_id: districtId,
      kakao_place_id: kakaoPlaceId,
      place_data: placeData as Prisma.InputJsonValue,
    },
    update: {
      place_data: placeData as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
  });

  return Response.json({ success: true, district_name: district.name });
}
