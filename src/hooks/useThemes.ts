import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { KakaoPlace } from "@/lib/kakao";

export interface Theme {
  id: string;
  name: string;
  icon_url: string | null;
}

export function useThemes() {
  return useQuery({
    queryKey: ["themes"],
    queryFn: async () => {
      const res = await fetch("/api/themes");
      if (!res.ok) throw new Error(`themes fetch failed: ${res.status}`);
      return (await res.json()) as Theme[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBarThemes(placeIds: string[], userId?: string | null) {
  const filterByUser = userId !== undefined;
  const enabled = placeIds.length > 0 && (!filterByUser || !!userId);

  return useQuery({
    queryKey: ["bar-themes", placeIds, userId ?? null],
    queryFn: async () => {
      if (placeIds.length === 0) return {};

      const params = new URLSearchParams();
      params.set("placeIds", placeIds.join(","));
      if (filterByUser && userId) params.set("userId", userId);

      const res = await fetch(`/api/bar-themes?${params.toString()}`);
      if (!res.ok) throw new Error(`bar-themes fetch failed: ${res.status}`);
      return (await res.json()) as Record<string, string[]>;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Single-query theme filtering:
 * 1. Get all kakao_place_ids tagged with the theme
 * 2. Fetch matching cached_places in the district
 * Uses keepPreviousData to prevent flickering on filter change.
 */
export function useThemeFilteredBars(themeId: string | null, districtName: string | null) {
  return useQuery({
    queryKey: ["theme-filtered-bars", themeId, districtName],
    queryFn: async () => {
      if (!themeId || !districtName) return { places: [], themeMap: {} };

      const res = await fetch(
        `/api/theme-filtered-bars?themeId=${encodeURIComponent(
          themeId
        )}&districtName=${encodeURIComponent(districtName)}`
      );
      if (!res.ok) throw new Error(`theme-filtered-bars fetch failed: ${res.status}`);
      return (await res.json()) as { places: KakaoPlace[]; themeMap: Record<string, string[]> };
    },
    enabled: !!themeId,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
