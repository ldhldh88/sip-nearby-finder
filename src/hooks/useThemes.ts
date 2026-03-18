import { useQuery } from "@tanstack/react-query";
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
 * Fetch all bars tagged with a specific theme in a specific district.
 * Returns KakaoPlace[] from cached_places that have the given theme.
 * Also returns bars with the theme that might not be in the district cache.
 */
export function useThemeFilteredBars(themeId: string | null, districtName: string | null) {
  return useQuery({
    queryKey: ["theme-filtered-bars", themeId, districtName],
    queryFn: async () => {
      if (!themeId) return null;

      // Get all place IDs with this theme
      const { data: themeEntries, error: tErr } = await supabase
        .from("bar_themes")
        .select("kakao_place_id")
        .eq("theme_id", themeId);
      if (tErr) throw tErr;

      const placeIds = (themeEntries || []).map((e) => e.kakao_place_id);
      if (placeIds.length === 0) return { places: [], themeMap: {} };

      // Find district ID
      const location = districtName?.split("/")[0]?.trim();
      let districtId: string | null = null;
      if (location) {
        const { data: districts } = await supabase
          .from("districts")
          .select("id")
          .ilike("name", `%${location}%`)
          .limit(1);
        districtId = districts?.[0]?.id ?? null;
      }

      // Get cached place data for these IDs (from current district or any district)
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

      // Build theme map for these places
      const themeMap: Record<string, string[]> = {};
      for (const id of placeIds) {
        if (!themeMap[id]) themeMap[id] = [];
        themeMap[id].push(themeId);
      }

      return { places, themeMap };
    },
    enabled: !!themeId,
    staleTime: 60 * 1000,
  });
}
