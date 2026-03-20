export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

interface SearchResult {
  places: KakaoPlace[];
  isEnd: boolean;
  total: number;
  pageableCount: number;
  currentPage: number;
  totalPages: number;
}

export async function searchBars(
  district: string,
  page = 1,
  size = 15
): Promise<SearchResult> {
  const params = new URLSearchParams({
    district,
    page: String(page),
    size: String(size),
  });

  const res = await fetch(`/api/kakao-search?${params}`);
  if (!res.ok) throw new Error(`kakao-search fetch failed: ${res.status}`);

  return (await res.json()) as SearchResult;
}
