import { useQuery } from "@tanstack/react-query";
import { KakaoPlace } from "@/lib/kakao";

async function searchBarsByName(keyword: string): Promise<KakaoPlace[]> {
  const query = `${keyword} 술집`;
  const params = new URLSearchParams({
    query,
    page: "1",
    size: "15",
    sort: "accuracy",
    mode: "simple",
  });

  const res = await fetch(`/api/kakao-search?${params}`);
  if (!res.ok) throw new Error(`Search error: ${res.status}`);
  const data = await res.json();
  return data.documents ?? [];
}

export function useBarSearch(keyword: string) {
  const trimmed = keyword.trim();
  return useQuery({
    queryKey: ["bar-search", trimmed],
    queryFn: () => searchBarsByName(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 3 * 60 * 1000,
  });
}
