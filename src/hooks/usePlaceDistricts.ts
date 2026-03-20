import { useQuery } from "@tanstack/react-query";

interface PlaceDistrictInfo {
  districtId: string;
  districtName: string;
}

export function usePlaceDistricts(placeIds: string[]) {
  return useQuery({
    queryKey: ["place-districts", placeIds],
    queryFn: async () => {
      if (placeIds.length === 0) return {};

      const res = await fetch(
        `/api/place-districts?placeIds=${encodeURIComponent(placeIds.join(","))}`
      );
      if (!res.ok) throw new Error(`place-districts fetch failed: ${res.status}`);

      return (await res.json()) as Record<string, PlaceDistrictInfo>;
    },
    enabled: placeIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
