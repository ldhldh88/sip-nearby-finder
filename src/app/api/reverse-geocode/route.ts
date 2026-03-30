/**
 * 브라우저 좌표 → 한글 주소 (카카오 로컬 coord2address).
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide#coord-to-address
 */

const COORD2ADDR_URL = "https://dapi.kakao.com/v2/local/geo/coord2address.json";

type KakaoCoordDoc = {
  road_address?: { address_name?: string } | null;
  address?: { address_name?: string } | null;
};

type KakaoCoordResponse = {
  documents?: KakaoCoordDoc[];
};

function pickAddress(doc: KakaoCoordDoc | undefined): string | null {
  if (!doc) return null;
  const road = doc.road_address?.address_name?.trim();
  if (road) return road;
  const jibun = doc.address?.address_name?.trim();
  return jibun || null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const latRaw = url.searchParams.get("lat");
  const lngRaw = url.searchParams.get("lng");

  const lat = latRaw !== null ? parseFloat(latRaw) : NaN;
  const lng = lngRaw !== null ? parseFloat(lngRaw) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "lat and lng are required as numbers", address: null }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json({ error: "lat/lng out of range", address: null }, { status: 400 });
  }

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key?.trim()) {
    return Response.json(
      { error: "KAKAO_REST_API_KEY is not configured", address: null },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    x: String(lng),
    y: String(lat),
  });

  const res = await fetch(`${COORD2ADDR_URL}?${params}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as KakaoCoordResponse & { message?: string };

  if (!res.ok) {
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : `Kakao API error (${res.status})`;
    return Response.json({ error: msg, address: null }, { status: 502 });
  }

  const address = pickAddress(data.documents?.[0]);

  return Response.json(
    { address },
    {
      headers: { "Cache-Control": "private, max-age=600" },
    }
  );
}
