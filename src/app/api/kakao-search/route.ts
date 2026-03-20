import { prisma } from "@/lib/prisma";
import { fetchKakaoKeywordSearch, getKakaoRestApiKey } from "@/lib/kakao-rest";

interface KakaoPlace {
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");

  /** 검색창 이름 검색 — Kakao 키워드 API 직접 호출 (구 kakao-proxy simple) */
  if (mode === "simple") {
    const query = url.searchParams.get("query") ?? "";
    if (!query.trim()) {
      return Response.json({
        documents: [],
        meta: { total_count: 0, pageable_count: 0, is_end: true },
      });
    }
    if (!getKakaoRestApiKey()) {
      return Response.json(
        { error: "KAKAO_REST_API_KEY not configured" },
        { status: 500 }
      );
    }
    const page = url.searchParams.get("page") ?? "1";
    const size = url.searchParams.get("size") ?? "15";
    const sort = url.searchParams.get("sort") ?? "accuracy";
    const params = new URLSearchParams({ query, page, size, sort });
    const result = await fetchKakaoKeywordSearch(params);
    return Response.json(result.data, { status: result.ok ? 200 : result.status });
  }

  const district = url.searchParams.get("district") ?? "";
  const page = Number(url.searchParams.get("page") ?? "1") || 1;
  const size = Number(url.searchParams.get("size") ?? "15") || 15;

  const location = district.trim();
  if (!location) {
    return Response.json({
      places: [],
      isEnd: true,
      total: 0,
      pageableCount: 0,
      currentPage: page,
      totalPages: 0,
    } satisfies SearchResult);
  }

  // 1) Try cached DB first
  const matched = await prisma.district.findFirst({
    where: {
      name: {
        contains: location,
        mode: "insensitive",
      },
    },
    select: { id: true, last_synced_at: true },
  });

  if (matched?.last_synced_at) {
    const cached = await prisma.cachedPlace.findMany({
      where: { district_id: matched.id },
      select: { place_data: true },
    });

    if (cached.length > 0) {
      const allPlaces = cached.map((c) => c.place_data as KakaoPlace);
      const totalCount = allPlaces.length;
      const totalPages = Math.ceil(totalCount / size);
      const start = (page - 1) * size;
      const pageItems = allPlaces.slice(start, start + size);

      return Response.json({
        places: pageItems,
        isEnd: page >= totalPages,
        total: totalCount,
        pageableCount: totalCount,
        currentPage: page,
        totalPages,
      } satisfies SearchResult);
    }
  }

  // 2) Fallback: Kakao 키워드 API 직접 호출
  if (!getKakaoRestApiKey()) {
    return Response.json(
      { error: "KAKAO_REST_API_KEY not configured" },
      { status: 500 }
    );
  }

  const query = `${location} 술집`;
  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
    sort: "accuracy",
  });

  const result = await fetchKakaoKeywordSearch(params);

  if (!result.ok) {
    return Response.json(
      { error: `Kakao API error: ${result.status}`, ...result.data },
      { status: result.status >= 500 ? 500 : result.status }
    );
  }

  const data = result.data as {
    documents?: KakaoPlace[];
    meta?: {
      total_count?: number;
      pageable_count?: number;
      is_end?: boolean;
    };
  };

  const totalCount = data.meta?.total_count ?? 0;
  const pageableCount = data.meta?.pageable_count ?? 0;
  const totalPages = Math.ceil(pageableCount / size);

  return Response.json({
    places: data.documents ?? [],
    isEnd: data.meta?.is_end ?? false,
    total: totalCount,
    pageableCount,
    currentPage: page,
    totalPages,
  } satisfies SearchResult);
}

