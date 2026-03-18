import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
