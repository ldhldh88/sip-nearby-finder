/**
 * Kakao Local / place payload shapes used across the app.
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword
 */
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

export interface KakaoKeywordMeta {
  total_count?: number;
  pageable_count?: number;
  is_end?: boolean;
}

export interface KakaoKeywordSearchData {
  documents?: KakaoPlace[];
  meta?: KakaoKeywordMeta;
}

export interface DistrictSearchResult {
  places: KakaoPlace[];
  isEnd: boolean;
  total: number;
  pageableCount: number;
  currentPage: number;
  totalPages: number;
}

export interface NearbyRankedPlace extends Record<string, unknown> {
  hotScore: number;
  distanceMeters: number;
}

export interface NearbyRankedResponse {
  places: NearbyRankedPlace[];
  total: number;
  timestamp: string;
}

export type KakaoKeywordFetchResult =
  | { ok: true; status: number; data: Record<string, unknown> }
  | { ok: false; status: number; data: Record<string, unknown> };
