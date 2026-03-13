const KAKAO_REST_API_KEY = "f001f46f12e7d23916cf8db9902c4aeb";

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
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

// Map district names to search-friendly location queries
function getSearchQuery(district: string): string {
  // Use the district name directly as a location keyword
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

  const res = await fetch(
    `https://dapis.kakao.com/v2/local/search/keyword.json?${params}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
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
