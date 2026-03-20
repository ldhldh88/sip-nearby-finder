import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { KakaoPlace } from "@/lib/kakao";
import type { MapViewportBounds } from "@/lib/mapViewport";
import type { BarMetaMap } from "@/hooks/useBarLikeCounts";

function roundBoundsKey(b: MapViewportBounds): string {
  const r = (n: number) => Math.round(n * 1e5) / 1e5;
  return [r(b.swLat), r(b.swLng), r(b.neLat), r(b.neLng)].join(",");
}

export interface PlacesInBoundsResult {
  places: KakaoPlace[];
  metaMap: BarMetaMap;
}

export function usePlacesInBounds(
  bounds: MapViewportBounds | null,
  options: { enabled: boolean; themeId: string | null }
) {
  const key = bounds ? roundBoundsKey(bounds) : "";

  return useQuery({
    queryKey: ["places-in-bounds", key, options.themeId ?? ""],
    queryFn: async (): Promise<PlacesInBoundsResult> => {
      if (!bounds) return { places: [], metaMap: {} };
      const params = new URLSearchParams({
        swLat: String(bounds.swLat),
        swLng: String(bounds.swLng),
        neLat: String(bounds.neLat),
        neLng: String(bounds.neLng),
      });
      if (options.themeId) params.set("themeId", options.themeId);

      const res = await fetch(`/api/places-in-bounds?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          typeof err?.error === "string" ? err.error : `places-in-bounds failed: ${res.status}`
        );
      }
      return (await res.json()) as PlacesInBoundsResult;
    },
    enabled: options.enabled && bounds !== null,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
