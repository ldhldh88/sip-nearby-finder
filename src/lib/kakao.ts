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

interface KakaoSearchResponse {
  documents: KakaoPlace[];
  meta: {
    is_end: boolean;
    pageable_count: number;
    total_count: number;
    same_name: {
      keyword: string;
      region: string[];
      selected_region: string;
    };
  };
}

function getSearchQuery(district: string): string {
  return district.split("/")[0];
}

export async function searchBars(
  district: string,
  page = 1,
  size = 15
): Promise<{ places: KakaoPlace[]; isEnd: boolean; total: number }> {
  const location = getSearchQuery(district);
  const query = `${location} 술집`;

  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
    sort: "accuracy",
  });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

  const data: KakaoSearchResponse = await res.json();

  return {
    places: data.documents,
    isEnd: data.meta.is_end,
    total: data.meta.total_count,
  };
}
