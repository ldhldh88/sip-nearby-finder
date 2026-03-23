import "server-only";

/**
 * Kakao Local REST + place page fetches (server-only).
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword
 */

import type {
  KakaoKeywordFetchResult,
  KakaoPlace,
  NearbyRankedPlace,
  NearbyRankedResponse,
} from "./types";

const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_CATEGORY_URL = "https://dapi.kakao.com/v2/local/search/category.json";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_PHOTOS = 5;

/** sync-places keyword fan-out */
export const SYNC_BAR_KEYWORDS = [
  "술집",
  "호프",
  "와인바",
  "칵테일바",
  "포차",
  "이자카야",
  "요리주점",
] as const;

const SYNC_KAKAO_PAGE_LIMIT = 3;
const SYNC_KAKAO_PAGE_SIZE = 15;
const SYNC_CATEGORY_CODE = "FD6";
const SYNC_CATEGORY_RADIUS = 2000;
const SYNC_CATEGORY_PAGE_LIMIT = 5;

const NEARBY_PAGES_TO_FETCH = 3;

function getRestApiKey(): string | undefined {
  return process.env.KAKAO_REST_API_KEY;
}

function isBarCategoryName(name: string | undefined): boolean {
  if (!name) return false;
  return (
    name.includes("술집") ||
    name.includes("호프") ||
    name.includes("와인바") ||
    name.includes("칵테일") ||
    name.includes("포차") ||
    name.includes("이자카야") ||
    name.includes("요리주점") ||
    name.includes("바(BAR)") ||
    name.includes("맥주") ||
    name.includes("펍")
  );
}

export class KakaoService {
  getRestApiKey(): string | undefined {
    return getRestApiKey();
  }

  async fetchKeywordSearch(params: URLSearchParams): Promise<KakaoKeywordFetchResult> {
    const key = getRestApiKey();
    if (!key) {
      return {
        ok: false as const,
        status: 500,
        data: { error: "KAKAO_REST_API_KEY not configured" },
      };
    }

    const res = await fetch(`${KAKAO_KEYWORD_URL}?${params}`, {
      headers: { Authorization: `KakaoAK ${key}` },
    });

    const data = (await res.json()) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  }

  /**
   * Multi-page keyword search for a sub-location + bar keyword (district sync).
   */
  async fetchKeywordPagesForLocation(
    location: string,
    keyword: string
  ): Promise<Record<string, unknown>[]> {
    const results: Record<string, unknown>[] = [];
    for (let page = 1; page <= SYNC_KAKAO_PAGE_LIMIT; page++) {
      const params = new URLSearchParams({
        query: `${location} ${keyword}`,
        page: String(page),
        size: String(SYNC_KAKAO_PAGE_SIZE),
        sort: "accuracy",
      });
      const res = await this.fetchKeywordSearch(params);
      if (!res.ok) break;
      const data = res.data as {
        documents?: Record<string, unknown>[];
        meta?: { is_end?: boolean };
      };
      const docs = data.documents ?? [];
      results.push(...docs);
      if (data.meta?.is_end) break;
    }
    return results;
  }

  async getCenterCoords(location: string): Promise<{ x: string; y: string } | null> {
    const params = new URLSearchParams({
      query: `${location} 술집`,
      page: "1",
      size: "1",
      sort: "accuracy",
    });
    const res = await this.fetchKeywordSearch(params);
    if (!res.ok) return null;
    const data = res.data as { documents?: KakaoPlace[] };
    const first = data.documents?.[0];
    if (!first) return null;
    return { x: first.x, y: first.y };
  }

  /**
   * Category search (FD6) around a point; bar-like categories only.
   */
  async fetchCategoryBarPages(
    x: string,
    y: string,
    radius: number
  ): Promise<Record<string, unknown>[]> {
    const key = getRestApiKey();
    if (!key) return [];

    const results: Record<string, unknown>[] = [];
    for (let page = 1; page <= SYNC_CATEGORY_PAGE_LIMIT; page++) {
      const params = new URLSearchParams({
        category_group_code: SYNC_CATEGORY_CODE,
        x,
        y,
        radius: String(radius),
        page: String(page),
        size: String(SYNC_KAKAO_PAGE_SIZE),
        sort: "distance",
      });
      const res = await fetch(`${KAKAO_CATEGORY_URL}?${params}`, {
        headers: { Authorization: `KakaoAK ${key}` },
      });
      if (!res.ok) break;
      const data = (await res.json()) as {
        documents?: Record<string, unknown>[];
        meta?: { is_end?: boolean };
      };
      const barDocs = (data.documents ?? []).filter((doc) =>
        isBarCategoryName(String(doc.category_name ?? ""))
      );
      results.push(...barDocs);
      if (data.meta?.is_end) break;
    }
    return results;
  }

  async getNearbyRanked(options: {
    x: string;
    y: string;
    radius: string;
    sort: string;
  }): Promise<{ ok: true; data: NearbyRankedResponse } | { ok: false; status: number; data: unknown }> {
    const { x, y, radius, sort } = options;
    if (!getRestApiKey()) {
      return {
        ok: false,
        status: 500,
        data: { error: "KAKAO_REST_API_KEY not configured" },
      };
    }

    const allDocuments: Record<string, unknown>[] = [];

    for (let page = 1; page <= NEARBY_PAGES_TO_FETCH; page++) {
      const params = new URLSearchParams({
        query: "술집",
        x,
        y,
        radius,
        sort,
        page: String(page),
        size: "15",
      });

      const result = await this.fetchKeywordSearch(params);
      if (!result.ok) {
        return { ok: false, status: result.status, data: result.data };
      }

      const data = result.data as {
        documents?: Record<string, unknown>[];
        meta?: { is_end?: boolean };
      };
      const docs = data.documents ?? [];
      allDocuments.push(...docs);
      if (data.meta?.is_end) break;
    }

    const now = new Date();
    const hour = now.getHours();

    const getTimeMult = (h: number) => {
      if (h >= 21 || h < 2) return 1.5;
      if (h >= 18 || h < 4) return 1.2;
      if (h >= 11 && h < 14) return 0.9;
      return 0.6;
    };

    const categoryWeights: Record<string, number> = {
      "호프,요리주점": 1.3,
      칵테일바: 1.4,
      와인바: 1.3,
      이자카야: 1.2,
      요리주점: 1.1,
      포장마차: 1.0,
      라운지바: 1.5,
      민속주점: 0.9,
    };

    const timeMult = getTimeMult(hour);
    const radiusNum = parseInt(radius, 10);

    const scoredPlaces = allDocuments.map((doc: Record<string, unknown>) => {
      const dist = parseInt(String(doc.distance ?? ""), 10) || radiusNum;
      const distScore = Math.max(0, 40 * (1 - dist / radiusNum));

      const catParts = String(doc.category_name ?? "").split(" > ");
      const shortCat = catParts[catParts.length - 1] || "";
      const catWeight = categoryWeights[shortCat] ?? 1.0;
      const catScore = 15 * catWeight;

      const rankIndex = allDocuments.indexOf(doc);
      const rankScore =
        allDocuments.length > 0
          ? Math.max(0, 30 * (1 - rankIndex / allDocuments.length))
          : 0;

      const rawScore = distScore + catScore + rankScore;
      const hotScore = Math.round(rawScore * timeMult);

      return {
        ...doc,
        hotScore,
        distanceMeters: dist,
      } as NearbyRankedPlace;
    });

    scoredPlaces.sort((a, b) => b.hotScore - a.hotScore);
    const topPlaces = scoredPlaces.slice(0, 10);

    return {
      ok: true,
      data: {
        places: topPlaces,
        total: allDocuments.length,
        timestamp: now.toISOString(),
      },
    };
  }

  private normalizeImageUrl(url: string): string {
    const t = url.trim();
    if (t.startsWith("//")) return `https:${t}`;
    return t;
  }

  private isStaticMapOg(url: string): boolean {
    return url.includes("staticmap.kakao.com");
  }

  private async collectPhotosFromJson(placeId: string, photos: string[]): Promise<void> {
    const res = await fetch(`https://place.map.kakao.com/main/v/${placeId}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return;

    const data = (await res.json()) as {
      basicInfo?: { mainphotourl?: string };
      photo?: { photoList?: Array<{ list?: Array<{ orgurl?: string; url?: string }> }> };
    };

    const mainPhoto = data?.basicInfo?.mainphotourl;
    if (mainPhoto) photos.push(this.normalizeImageUrl(mainPhoto));

    const photoGroups = data?.photo?.photoList;
    if (photoGroups && Array.isArray(photoGroups)) {
      for (const group of photoGroups) {
        if (group.list && Array.isArray(group.list)) {
          for (const item of group.list) {
            const photoUrl = item.orgurl || item.url;
            if (
              photoUrl &&
              !photos.includes(this.normalizeImageUrl(photoUrl)) &&
              photos.length < MAX_PHOTOS
            ) {
              photos.push(this.normalizeImageUrl(photoUrl));
            }
          }
        }
        if (photos.length >= MAX_PHOTOS) break;
      }
    }
  }

  private async collectPhotosFromHtml(placeId: string, photos: string[]): Promise<void> {
    const htmlRes = await fetch(`https://place.map.kakao.com/${placeId}`, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    if (!htmlRes.ok) return;

    const html = await htmlRes.text();
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogMatch?.[1]) {
      const u = this.normalizeImageUrl(ogMatch[1]);
      if (!this.isStaticMapOg(u)) photos.push(u);
    }

    if (photos.length === 0) {
      const tw = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
      if (tw?.[1]) photos.push(this.normalizeImageUrl(tw[1]));
    }
  }

  async fetchPlacePhotos(placeId: string): Promise<string[]> {
    const photos: string[] = [];

    try {
      await this.collectPhotosFromJson(placeId, photos);
    } catch {
      // JSON endpoint deprecated or changed
    }

    if (photos.length === 0) {
      try {
        await this.collectPhotosFromHtml(placeId, photos);
      } catch {
        // ignore
      }
    }

    return photos.slice(0, MAX_PHOTOS);
  }
}

export const kakaoService = new KakaoService();

export { SYNC_CATEGORY_RADIUS };
