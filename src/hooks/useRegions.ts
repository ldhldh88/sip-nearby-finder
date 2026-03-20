import { useQuery } from "@tanstack/react-query";

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
      const res = await fetch("/api/regions");
      if (!res.ok) throw new Error(`regions fetch failed: ${res.status}`);
      const data = (await res.json()) as { provinces: Province[]; districts: District[] };
      return {
        provinces: data.provinces ?? [],
        districts: data.districts ?? [],
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
