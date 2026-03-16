import { useEffect, useRef, useState } from "react";
import { HotPlace } from "@/hooks/useNearbyBars";
import { getKakaoSdkUrl } from "@/lib/kakao-client";

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  center: { lat: number; lng: number };
  places: HotPlace[];
  onSelectPlace?: (place: HotPlace) => void;
  className?: string;
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

// Map category to emoji marker
function getCategoryEmoji(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("와인")) return "🍷";
  if (name.includes("칵테일") || name.includes("라운지")) return "🍸";
  if (name.includes("이자카야") || name.includes("일본식")) return "🍶";
  return "🍺";
}

const KakaoMap = ({ center, places, onSelectPlace, className }: KakaoMapProps) => {
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

  // Initialize map
  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const { kakao } = window;
    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    mapRef.current = map;

    // Current location marker
    const userMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(center.lat, center.lng),
      map,
    });

    return () => {
      userMarker.setMap(null);
    };
  }, [ready, center.lat, center.lng]);

  // Update markers
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const { kakao } = window;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    places.forEach((place, i) => {
      const pos = new kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x));
      const emoji = getCategoryEmoji(place.category_name);

      const content = document.createElement("div");
      content.innerHTML = `<div style="
        display:flex;align-items:center;justify-content:center;gap:2px;
        padding:3px 8px;border-radius:16px;
        background:hsl(var(--primary));color:#fff;font-weight:700;font-size:13px;
        border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);
        cursor:pointer;white-space:nowrap;
      "><span style="font-size:14px">${emoji}</span>${i + 1}</div>`;

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content,
        yAnchor: 1.2,
      });
      overlay.setMap(map);

      content.addEventListener("click", () => onSelectPlace?.(place));

      markersRef.current.push({ setMap: (m: any) => overlay.setMap(m) });
    });
  }, [ready, places, onSelectPlace]);

  return (
    <div ref={containerRef} className={className} style={{ minHeight: 250 }}>
      {!ready && (
        <div className="flex h-full items-center justify-center bg-muted rounded-xl">
          <span className="text-sm text-muted-foreground">지도 로딩 중…</span>
        </div>
      )}
    </div>
  );
};

export default KakaoMap;
