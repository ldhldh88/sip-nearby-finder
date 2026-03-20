import { prisma } from "@/lib/prisma";
import type { KakaoPlace } from "@/lib/kakao";

export type CachedPlaceForSeo = {
  place: KakaoPlace;
  districtName: string;
  provinceName: string;
  updatedAt: Date;
};

export async function getCachedPlaceByKakaoId(
  kakaoPlaceId: string
): Promise<CachedPlaceForSeo | null> {
  const row = await prisma.cachedPlace.findFirst({
    where: { kakao_place_id: kakaoPlaceId },
    orderBy: { updated_at: "desc" },
    include: {
      district: { include: { province: true } },
    },
  });

  if (!row) return null;

  const place = row.place_data as KakaoPlace;
  if (!place?.place_name || !place?.id) return null;

  return {
    place,
    districtName: row.district.name,
    provinceName: row.district.province.name,
    updatedAt: row.updated_at,
  };
}
