import type { KakaoPlace } from "@/lib/kakao";
import { getSiteUrl } from "@/lib/site";

export function buildBarJsonLd(
  place: KakaoPlace,
  districtName: string,
  provinceName: string
): Record<string, unknown> {
  const base = getSiteUrl();
  const url = `${base}/bar/${encodeURIComponent(place.id)}`;
  const address = place.road_address_name || place.address_name || "";
  const lat = parseFloat(place.y);
  const lng = parseFloat(place.x);

  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: place.place_name,
    description: `${place.category_name} · ${districtName}(${provinceName}) 지역의 술집 정보 — FirePlace`,
    url,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressRegion: provinceName,
      addressLocality: districtName,
      addressCountry: "KR",
    },
  };

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    json.geo = {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    };
  }

  if (place.phone?.trim()) {
    json.telephone = place.phone.trim();
  }

  return json;
}
