import { useQuery } from "@tanstack/react-query";
import type { KakaoPlace } from "@/lib/kakao";
import type { BarMetaMap } from "@/hooks/useBarLikeCounts";
import type { NearbyRecommendKind } from "@/lib/nearby-recommend";

export interface NearbyRecommendResult {
  kind: NearbyRecommendKind;
  places: KakaoPlace[];
  metaMap: BarMetaMap;
}

async function fetchNearbyRecommend(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<NearbyRecommendResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radiusMeters: String(radiusMeters),
  });
  const res = await fetch(`/api/nearby-recommend?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err?.error === "string" ? err.error : `nearby-recommend: ${res.status}`);
  }
  return (await res.json()) as NearbyRecommendResult;
}

export function useNearbyRecommend(
  lat: number | null,
  lng: number | null,
  radiusMeters: number = 1000
) {
  return useQuery({
    queryKey: ["nearby-recommend", lat, lng, radiusMeters],
    queryFn: () => fetchNearbyRecommend(lat!, lng!, radiusMeters),
    enabled: lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng),
    staleTime: 90_000,
    gcTime: 5 * 60_000,
  });
}
