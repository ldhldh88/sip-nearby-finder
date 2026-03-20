import { fetchKakaoKeywordSearch, getKakaoRestApiKey } from "@/lib/kakao-rest";

const PAGES_TO_FETCH = 3;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const x = url.searchParams.get("x");
  const y = url.searchParams.get("y");
  const radius = url.searchParams.get("radius") || "2000";
  const sort = url.searchParams.get("sort") || "accuracy";

  if (!getKakaoRestApiKey()) {
    return Response.json({ error: "KAKAO_REST_API_KEY not configured" }, { status: 500 });
  }

  if (!x || !y) {
    return Response.json({ error: "x and y parameters are required" }, { status: 400 });
  }

  const allDocuments: Record<string, unknown>[] = [];

  for (let page = 1; page <= PAGES_TO_FETCH; page++) {
    const params = new URLSearchParams({
      query: "술집",
      x,
      y,
      radius,
      sort,
      page: String(page),
      size: "15",
    });

    const result = await fetchKakaoKeywordSearch(params);
    if (!result.ok) {
      return Response.json(result.data, { status: result.status });
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
    };
  });

  scoredPlaces.sort((a, b) => (b.hotScore as number) - (a.hotScore as number));
  const topPlaces = scoredPlaces.slice(0, 10);

  return Response.json({
    places: topPlaces,
    total: allDocuments.length,
    timestamp: now.toISOString(),
  });
}
