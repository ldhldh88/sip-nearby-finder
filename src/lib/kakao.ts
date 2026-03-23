/**
 * 클라이언트용: 도메인 타입 + 자사 BFF(`/api/kakao-search` 등) 호출만 포함합니다.
 * Kakao REST 호출은 `@/lib/kakao/kakao.service`에서 서버 전용으로 처리합니다.
 */

import type { DistrictSearchResult, KakaoPlace } from "./kakao/types";

export type { KakaoPlace, DistrictSearchResult };

export async function searchBars(
  district: string,
  page = 1,
  size = 15
): Promise<DistrictSearchResult> {
  const params = new URLSearchParams({
    district,
    page: String(page),
    size: String(size),
  });

  const res = await fetch(`/api/kakao-search?${params}`);
  if (!res.ok) throw new Error(`kakao-search fetch failed: ${res.status}`);

  return (await res.json()) as DistrictSearchResult;
}
