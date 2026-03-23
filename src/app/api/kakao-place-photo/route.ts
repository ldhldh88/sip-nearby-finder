import { kakaoService } from "@/lib/kakao/kakao.service";

interface KakaoPlacePhotoResponse {
  photo_url: string | null;
  photos: string[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, { photos: string[]; ts: number }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeId = url.searchParams.get("placeId");

  if (!placeId) {
    return Response.json({ error: "placeId is required" }, { status: 400 });
  }

  const cached = cache.get(placeId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    const body: KakaoPlacePhotoResponse = {
      photo_url: cached.photos[0] ?? null,
      photos: cached.photos,
    };
    return Response.json(body, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  const photos = await kakaoService.fetchPlacePhotos(placeId);
  cache.set(placeId, { photos, ts: Date.now() });

  if (cache.size > 5000) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < 1000 && i < oldest.length; i++) {
      cache.delete(oldest[i][0]);
    }
  }

  const body: KakaoPlacePhotoResponse = {
    photo_url: photos[0] ?? null,
    photos,
  };

  return Response.json(body, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
