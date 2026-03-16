export const KAKAO_APP_KEY = "1d5b620dc479683422dcaabd880e8698";

export function getKakaoSdkUrl() {
  const params = new URLSearchParams({
    appkey: KAKAO_APP_KEY,
    autoload: "false",
  });

  return `//dapi.kakao.com/v2/maps/sdk.js?${params.toString()}`;
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
