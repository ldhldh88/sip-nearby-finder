/**
 * Kakao Local REST API (server-only). Uses KAKAO_REST_API_KEY.
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword
 */

const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

export function getKakaoRestApiKey(): string | undefined {
  return process.env.KAKAO_REST_API_KEY;
}

export async function fetchKakaoKeywordSearch(params: URLSearchParams) {
  const key = getKakaoRestApiKey();
  if (!key) {
    return { ok: false as const, status: 500, data: { error: "KAKAO_REST_API_KEY not configured" } };
  }

  const res = await fetch(`${KAKAO_KEYWORD_URL}?${params}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  });

  const data = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}
