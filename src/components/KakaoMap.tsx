import { useEffect, useRef, useState } from "react";
import { getKakaoSdkUrl } from "@/lib/kakao-client";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    kakao: any;
  }
}

/** 카카오 장소 좌표·표시에 필요한 최소 필드 (KakaoPlace / HotPlace 호환) */
export type MapPlace = {
  id: string;
  place_name: string;
  category_name: string;
  x: string;
  y: string;
};

export type KakaoMapMarkerVariant = "default" | "pill";

interface KakaoMapProps {
  center: { lat: number; lng: number };
  places: MapPlace[];
  onSelectPlace?: (place: MapPlace) => void;
  className?: string;
  /** 기본: primary 칩 + 이모지 + 순번 / pill: 흰 배경 + 장소명 */
  markerVariant?: KakaoMapMarkerVariant;
  /** 기본 true. 지역 전체 맵에서는 false */
  showUserMarker?: boolean;
  /** true면 마커 좌표에 맞춰 지도 bounds 조정 (주변 핫플 미니맵은 false) */
  fitBoundsToPlaces?: boolean;
}

let sdkLoaded = false;
let sdkPromise: Promise<void> | null = null;

function loadKakaoSDK(): Promise<void> {
  if (sdkLoaded && window.kakao?.maps) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const initialize = () => {
      if (!window.kakao?.maps) {
        sdkPromise = null;
        reject(new Error("Kakao Maps SDK 초기화 실패"));
        return;
      }

      window.kakao.maps.load(() => {
        sdkLoaded = true;
        resolve();
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
    if (existingScript) {
      if (window.kakao?.maps) {
        initialize();
        return;
      }
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.dataset.kakaoSdk = "true";
    script.src = getKakaoSdkUrl();
    script.onload = initialize;
    script.onerror = () => {
      script.remove();
      sdkPromise = null;
      reject(new Error("Kakao Maps SDK 로드 실패 - JavaScript 키와 사이트 도메인 설정을 확인하세요."));
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}

function getCategoryEmoji(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("와인")) return "🍷";
  if (name.includes("칵테일") || name.includes("라운지")) return "🍸";
  if (name.includes("이자카야") || name.includes("일본식")) return "🍶";
  return "🍺";
}

function truncateLabel(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

const KakaoMap = ({
  center,
  places,
  onSelectPlace,
  className,
  markerVariant = "default",
  showUserMarker = true,
  fitBoundsToPlaces = false,
}: KakaoMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadKakaoSDK()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const { kakao } = window;
    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    mapRef.current = map;

    let userMarker: any = null;
    if (showUserMarker) {
      userMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(center.lat, center.lng),
        map,
      });
    }

    return () => {
      if (userMarker) userMarker.setMap(null);
    };
  }, [ready, center.lat, center.lng, showUserMarker]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const { kakao } = window;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    places.forEach((place, i) => {
      const pos = new kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x));
      const content = document.createElement("div");

      if (markerVariant === "pill") {
        const inner = document.createElement("div");
        inner.style.cssText = [
          "display:inline-flex",
          "align-items:center",
          "justify-content:center",
          "max-width:160px",
          "padding:6px 10px",
          "border-radius:9999px",
          "background:#fff",
          "color:#111",
          "font-weight:600",
          "font-size:12px",
          "line-height:1.2",
          "border:1px solid rgba(0,0,0,.2)",
          "box-shadow:0 2px 8px rgba(0,0,0,.15)",
          "cursor:pointer",
          "white-space:nowrap",
          "overflow:hidden",
          "text-overflow:ellipsis",
        ].join(";");
        inner.textContent = truncateLabel(place.place_name, 14);
        content.appendChild(inner);
      } else {
        const emoji = getCategoryEmoji(place.category_name);
        content.innerHTML = `<div style="
        display:flex;align-items:center;justify-content:center;gap:2px;
        padding:3px 8px;border-radius:16px;
        background:hsl(var(--primary));color:#fff;font-weight:700;font-size:13px;
        border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);
        cursor:pointer;white-space:nowrap;
      "><span style="font-size:14px">${emoji}</span>${i + 1}</div>`;
      }

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content,
        yAnchor: markerVariant === "pill" ? 1 : 1.2,
      });
      overlay.setMap(map);

      const target = content.firstElementChild ?? content;
      target.addEventListener("click", () => onSelectPlace?.(place));

      markersRef.current.push({ setMap: (m: any) => overlay.setMap(m) });
    });
  }, [ready, places, onSelectPlace, markerVariant]);

  useEffect(() => {
    if (!ready || !mapRef.current || !fitBoundsToPlaces) return;
    const { kakao } = window;
    const map = mapRef.current;

    if (places.length === 0) return;

    if (places.length === 1) {
      const p = places[0];
      map.setCenter(new kakao.maps.LatLng(parseFloat(p.y), parseFloat(p.x)));
      map.setLevel(4);
      return;
    }

    const bounds = new kakao.maps.LatLngBounds();
    places.forEach((place) => {
      bounds.extend(new kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x)));
    });
    map.setBounds(bounds);
  }, [ready, places, fitBoundsToPlaces]);

  return (
    <div ref={containerRef} className={cn("min-h-[250px]", className)}>
      {!ready && (
        <div className="flex h-full items-center justify-center bg-muted rounded-xl">
          <span className="text-sm text-muted-foreground">지도 로딩 중…</span>
        </div>
      )}
    </div>
  );
};

export default KakaoMap;
