import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBarLikeCounts(placeIds: string[]) {
  return useQuery({
    queryKey: ["bar-like-counts", placeIds],
    queryFn: async () => {
      if (placeIds.length === 0) return {};
      const { data } = await supabase
        .from("bar_meta")
        .select("kakao_place_id, like_count")
        .in("kakao_place_id", placeIds);

      const map: Record<string, number> = {};
      for (const row of data || []) {
        map[row.kakao_place_id] = row.like_count;
      }
      return map;
    },
    enabled: placeIds.length > 0,
    staleTime: 30_000,
  });
}
