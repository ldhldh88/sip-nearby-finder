import { useQuery } from "@tanstack/react-query";

export interface HotPlace {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
  hotScore: number;
  distanceMeters: number;
}

interface NearbyResult {
  places: HotPlace[];
  total: number;
  timestamp: string;
}

async function fetchNearbyBars(
  lng: number,
  lat: number,
  radius: number
): Promise<NearbyResult> {
  const params = new URLSearchParams({
    x: String(lng),
    y: String(lat),
    radius: String(radius),
    sort: "accuracy",
  });

  const res = await fetch(`/api/kakao-nearby?${params}`);
  if (!res.ok) throw new Error(`Nearby search error: ${res.status}`);
  return res.json();
}

export function useNearbyBars(
  lat: number | null,
  lng: number | null,
  radius: number = 2000
) {
  return useQuery({
    queryKey: ["nearby-bars", lat, lng, radius],
    queryFn: () => fetchNearbyBars(lng!, lat!, radius),
    enabled: lat !== null && lng !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
