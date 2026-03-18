import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("themes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Theme[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBarThemes(placeIds: string[]) {
  return useQuery({
    queryKey: ["bar-themes", placeIds],
    queryFn: async () => {
      if (placeIds.length === 0) return {};
      const { data, error } = await supabase
        .from("bar_themes")
        .select("kakao_place_id, theme_id")
        .in("kakao_place_id", placeIds);
      if (error) throw error;

      const map: Record<string, string[]> = {};
      for (const row of data || []) {
        if (!map[row.kakao_place_id]) map[row.kakao_place_id] = [];
        map[row.kakao_place_id].push(row.theme_id);
      }
      return map;
    },
    enabled: placeIds.length > 0,
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

      // Parallel: fetch theme place IDs + district ID
      const location = districtName.split("/")[0]?.trim();

      const [themeResult, districtResult] = await Promise.all([
        supabase
          .from("bar_themes")
          .select("kakao_place_id")
          .eq("theme_id", themeId),
        supabase
          .from("districts")
          .select("id")
          .ilike("name", `%${location}%`)
          .limit(1),
      ]);

      if (themeResult.error) throw themeResult.error;

      const placeIds = (themeResult.data || []).map((e) => e.kakao_place_id);
      if (placeIds.length === 0) return { places: [], themeMap: {} };

      const districtId = districtResult.data?.[0]?.id;

      // Fetch cached places matching theme place IDs in this district
      let query = supabase
        .from("cached_places")
        .select("kakao_place_id, place_data")
        .in("kakao_place_id", placeIds);

      if (districtId) {
        query = query.eq("district_id", districtId);
      }

      const { data: cached, error: cErr } = await query;
      if (cErr) throw cErr;

      const places: KakaoPlace[] = (cached || []).map(
        (c) => c.place_data as unknown as KakaoPlace
      );

      const themeMap: Record<string, string[]> = {};
      for (const id of placeIds) {
        if (!themeMap[id]) themeMap[id] = [];
        themeMap[id].push(themeId);
      }

      return { places, themeMap };
    },
    enabled: !!themeId,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
