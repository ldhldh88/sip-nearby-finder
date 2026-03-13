import { useQuery } from "@tanstack/react-query";
import { KakaoPlace } from "@/lib/kakao";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function searchBarsByName(keyword: string): Promise<KakaoPlace[]> {
  const query = `${keyword} 술집`;
  const params = new URLSearchParams({
    query,
    page: "1",
    size: "15",
    sort: "accuracy",
  });

  const res = await fetch(`${supabaseUrl}/functions/v1/kakao-proxy?${params}`, {
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
  });

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
