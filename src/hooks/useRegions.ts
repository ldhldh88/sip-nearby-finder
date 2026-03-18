import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Province {
  id: string;
  name: string;
  sort_order: number;
}

export interface District {
  id: string;
  province_id: string;
  name: string;
  sort_order: number;
}

export interface Region {
  province: string;
  districts: string[];
}

export function useRegionsRaw() {
  return useQuery({
    queryKey: ["provinces-districts"],
    queryFn: async () => {
      const [{ data: provinces, error: pErr }, { data: districts, error: dErr }] =
        await Promise.all([
          supabase.from("provinces").select("*").order("sort_order"),
          supabase.from("districts").select("*").order("sort_order"),
        ]);
      if (pErr) throw pErr;
      if (dErr) throw dErr;
      return {
        provinces: (provinces || []) as Province[],
        districts: (districts || []) as District[],
      };
    },
  });
}

/** Returns regions in the same shape as the old hardcoded REGIONS array */
export function useRegions() {
  const { data, ...rest } = useRegionsRaw();

  const regions: Region[] = [];
  if (data) {
    for (const p of data.provinces) {
      regions.push({
        province: p.name,
        districts: data.districts
          .filter((d) => d.province_id === p.id)
          .map((d) => d.name),
      });
    }
  }

  return { data: regions, ...rest };
}
