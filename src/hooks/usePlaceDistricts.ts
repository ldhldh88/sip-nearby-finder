import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlaceDistrictInfo {
  districtId: string;
  districtName: string;
}

export function usePlaceDistricts(placeIds: string[]) {
  return useQuery({
    queryKey: ["place-districts", placeIds],
    queryFn: async () => {
      if (placeIds.length === 0) return {};

      const { data, error } = await supabase
        .from("cached_places")
        .select("kakao_place_id, district_id, districts!inner(name)")
        .in("kakao_place_id", placeIds);

      if (error) throw error;

      const map: Record<string, PlaceDistrictInfo> = {};
      for (const row of data || []) {
        const districtData = row.districts as any;
        map[row.kakao_place_id] = {
          districtId: row.district_id,
          districtName: districtData?.name ?? "",
        };
      }
      return map;
    },
    enabled: placeIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
