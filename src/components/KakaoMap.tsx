import { useEffect, useRef, useState } from "react";
import { HotPlace } from "@/hooks/useNearbyBars";

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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let sdkLoaded = false;
let sdkPromise: Promise<void> | null = null;

async function fetchJsKey(): Promise<string> {
  const res = await fetch(`${supabaseUrl}/functions/v1/kakao-js-key`, {
    headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey },
  });
  if (!res.ok) throw new Error("Failed to fetch Kakao JS key");
  const { key } = await res.json();
  return key;
}

function loadKakaoSDK(): Promise<void> {
  if (sdkLoaded && window.kakao?.maps) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = (async () => {
    // If script tag exists and kakao object is available, just call load
    const existingScript = document.querySelector(`script[src*="dapi.kakao.com"]`);
    if (existingScript && window.kakao?.maps) {
      await new Promise<void>((resolve) =>
        window.kakao.maps.load(() => { sdkLoaded = true; resolve(); })
      );
      return;
    }
    // Remove any previously failed script tag
    if (existingScript) {
      existingScript.remove();
    }
    const jsKey = await fetchJsKey();
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&autoload=false`;
      script.onload = () => {
        window.kakao.maps.load(() => { sdkLoaded = true; resolve(); });
      };
      script.onerror = () => {
        sdkPromise = null; // allow retry
        reject(new Error("Kakao Maps SDK 로드 실패 - 도메인이 카카오 개발자 콘솔에 등록되어 있는지 확인하세요."));
      };
      document.head.appendChild(script);
    });
  })();
  return sdkPromise;
}

const KakaoMap = ({ center, places, onSelectPlace, className }: KakaoMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadKakaoSDK().then(() => setReady(true));
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

      // Custom overlay for rank number
      const content = document.createElement("div");
      content.innerHTML = `<div style="
        display:flex;align-items:center;justify-content:center;
        width:28px;height:28px;border-radius:50%;
        background:hsl(15,80%,50%);color:#fff;font-weight:700;font-size:13px;
        border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);
        cursor:pointer;
      ">${i + 1}</div>`;

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
