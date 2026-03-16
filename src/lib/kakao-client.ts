export const KAKAO_APP_KEY = "06d3d738164f2383f9b361e0bfcc3bef";

export function getKakaoSdkUrl() {
  const params = new URLSearchParams({
    appkey: KAKAO_APP_KEY,
    autoload: "false",
  });

  return `https://dapi.kakao.com/v2/maps/sdk.js?${params.toString()}`;
}

interface KakaoStaticMapOptions {
  lat: string | number;
  lng: string | number;
  width: number;
  height: number;
  level?: number;
  mapType?: string;
}

export function getKakaoStaticMapUrl({
  lat,
  lng,
  width,
  height,
  level = 3,
  mapType,
}: KakaoStaticMapOptions) {
  const params = new URLSearchParams({
    appkey: KAKAO_APP_KEY,
    center: `${lng},${lat}`,
    level: String(level),
    width: String(width),
    height: String(height),
  });

  if (mapType) {
    params.set("mapType", mapType);
  }

  return `https://dapi.kakao.com/v2/maps/staticmap?${params.toString()}`;
}
