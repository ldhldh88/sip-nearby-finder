import { useQuery } from "@tanstack/react-query";
import { KakaoPlace } from "@/lib/kakao";
import { BarMeta, BarMetaMap } from "@/hooks/useBarLikeCounts";

export interface DistrictBar {
  place: KakaoPlace;
  meta: BarMeta;
}

/**
 * Fetch all bars in a district sorted by popularity via DB function.
 * Returns places + their bar_meta in a single query.
 */
export function useDistrictBars(districtName: string | null) {
  return useQuery({
    queryKey: ["district-bars", districtName],
    queryFn: async () => {
      if (!districtName) return { places: [], metaMap: {} };

      const res = await fetch(
        `/api/district-bars?districtName=${encodeURIComponent(districtName)}`
      );
      if (!res.ok) throw new Error(`district-bars fetch failed: ${res.status}`);
      const data = (await res.json()) as { places: KakaoPlace[]; metaMap: BarMetaMap };

      return data;
    },
    enabled: !!districtName,
    staleTime: 30_000,
  });
}
