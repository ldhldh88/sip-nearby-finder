import { useQuery } from "@tanstack/react-query";

function roundCoord(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

export function useReverseGeocode(lat: number | null, lng: number | null) {
  const latKey = lat !== null ? roundCoord(lat) : null;
  const lngKey = lng !== null ? roundCoord(lng) : null;

  return useQuery({
    queryKey: ["reverse-geocode", latKey, lngKey],
    queryFn: async (): Promise<{ address: string | null; error?: string }> => {
      const res = await fetch(`/api/reverse-geocode?lat=${latKey}&lng=${lngKey}`);
      const json = (await res.json()) as { address?: string | null; error?: string };
      if (!res.ok) {
        return {
          address: null,
          error: typeof json.error === "string" ? json.error : `요청 실패 (${res.status})`,
        };
      }
      return {
        address: json.address ?? null,
        error: json.error,
      };
    },
    enabled: latKey !== null && lngKey !== null,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
