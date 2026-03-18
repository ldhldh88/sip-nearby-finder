import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      const { data, error } = await supabase.rpc("get_district_bars", {
        p_district_name: districtName,
      });

      if (error) throw error;

      const places: KakaoPlace[] = [];
      const metaMap: BarMetaMap = {};

      for (const row of data || []) {
        const place = row.place_data as unknown as KakaoPlace;
        places.push(place);
        metaMap[row.kakao_place_id] = {
          like_count: row.like_count,
          view_count: row.view_count,
          bookmark_count: row.bookmark_count,
          hot_score: row.hot_score,
        };
      }

      return { places, metaMap };
    },
    enabled: !!districtName,
    staleTime: 30_000,
  });
}
