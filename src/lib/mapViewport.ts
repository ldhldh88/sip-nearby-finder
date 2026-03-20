/** 카카오맵 getBounds()에 대응 (남서·북동) */
export type MapViewportBounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

/** place: Kakao 좌표 — y=위도, x=경도 */
export function filterPlacesByViewport<T extends { x: string; y: string }>(
  places: T[],
  b: MapViewportBounds
): T[] {
  const minLat = Math.min(b.swLat, b.neLat);
  const maxLat = Math.max(b.swLat, b.neLat);
  const minLng = Math.min(b.swLng, b.neLng);
  const maxLng = Math.max(b.swLng, b.neLng);

  return places.filter((p) => {
    const lat = parseFloat(p.y);
    const lng = parseFloat(p.x);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  });
}
