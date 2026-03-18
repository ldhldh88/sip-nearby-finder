import { supabase } from "@/integrations/supabase/client";

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

function getSearchQuery(district: string): string {
  return district;
}

/**
 * Try to load from cached_places DB first.
 * Falls back to kakao-proxy edge function if no cache exists.
 */
export async function searchBars(
  district: string,
  page = 1,
  size = 15
): Promise<SearchResult> {
  // 1. Find district in DB
  const location = getSearchQuery(district);

  const { data: districts } = await supabase
    .from("districts")
    .select("id, last_synced_at")
    .ilike("name", `%${location}%`)
    .limit(1);

  const matched = districts?.[0];

  // 2. If synced, serve from cached_places
  if (matched?.last_synced_at) {
    const { data: cached, error } = await supabase
      .from("cached_places")
      .select("place_data")
      .eq("district_id", matched.id);

    if (!error && cached && cached.length > 0) {
      const allPlaces = cached.map((c) => c.place_data as unknown as KakaoPlace);
      const totalCount = allPlaces.length;
      const totalPages = Math.ceil(totalCount / size);
      const start = (page - 1) * size;
      const pageItems = allPlaces.slice(start, start + size);

      return {
        places: pageItems,
        isEnd: page >= totalPages,
        total: totalCount,
        pageableCount: totalCount,
        currentPage: page,
        totalPages,
      };
    }
  }

  // 3. Fallback: call kakao-proxy edge function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const query = `${location} 술집`;
  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
    sort: "accuracy",
  });

  const res = await fetch(
    `${supabaseUrl}/functions/v1/kakao-proxy?${params}`,
    {
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Kakao API error: ${res.status}`);
  }

  const data = await res.json();
  const totalCount = data.meta.total_count;
  const pageableCount = data.meta.pageable_count;
  const totalPages = Math.ceil(pageableCount / size);

  return {
    places: data.documents,
    isEnd: data.meta.is_end,
    total: totalCount,
    pageableCount,
    currentPage: page,
    totalPages,
  };
}
