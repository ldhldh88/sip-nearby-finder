"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { getKakaoSdkUrl } from "@/lib/kakao-client";
import type { MapViewportBounds } from "@/lib/mapViewport";
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
  /**
   * fitBounds에만 사용할 장소 목록. 지정 시 뷰포트로 줄인 `places`와 달리 구역 전체로만 자동 맞춤(팬할 때마다 줌 리셋 방지).
   * 미지정 시 `places`로 맞춤.
   */
  fitBoundsSource?: MapPlace[];
  /** true면 idle 시 보이는 영역(bounds)을 부모에 전달 — 지도 뷰에서 마커를 뷰포트에 맞출 때 사용 */
  trackViewportBounds?: boolean;
  onViewportBoundsChange?: (bounds: MapViewportBounds) => void;
  /**
   * 목록 뷰에서 맵을 미리 마운트할 때 false. true로 바뀌는 순간 relayout(바로 표시).
   * @default true
   */
  mapActive?: boolean;
  /** true면 우측 하단에 현재 위치로 이동 버튼 표시 (Geolocation API) */
  showMyLocationButton?: boolean;
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
  fitBoundsSource,
  trackViewportBounds = false,
  onViewportBoundsChange,
  mapActive = true,
  showMyLocationButton = false,
}: KakaoMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const myLocationMarkerRef = useRef<any>(null);
  const viewportCbRef = useRef(onViewportBoundsChange);
  viewportCbRef.current = onViewportBoundsChange;
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  const fitSource = useMemo(
    () => (fitBoundsSource !== undefined ? fitBoundsSource : places),
    [fitBoundsSource, places]
  );

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
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setMap(null);
        myLocationMarkerRef.current = null;
      }
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

    if (fitSource.length === 0) return;

    if (fitSource.length === 1) {
      const p = fitSource[0];
      map.setCenter(new kakao.maps.LatLng(parseFloat(p.y), parseFloat(p.x)));
      map.setLevel(4);
      queueMicrotask(() => map.relayout());
      return;
    }

    const bounds = new kakao.maps.LatLngBounds();
    fitSource.forEach((place) => {
      bounds.extend(new kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x)));
    });
    map.setBounds(bounds);
    queueMicrotask(() => map.relayout());
  }, [ready, fitSource, fitBoundsToPlaces]);

  /** 지도 이동·줌이 끝날 때(idle) 보이는 영역을 부모에 전달 — 카카오맵 샘플 패턴 */
  useEffect(() => {
    if (!ready || !mapRef.current || !trackViewportBounds || !mapActive) return;
    const map = mapRef.current;
    const { kakao } = window;
    let timeoutId: ReturnType<typeof setTimeout>;

    const emit = () => {
      if (!mapRef.current) return;
      const b = map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      viewportCbRef.current?.({
        swLat: sw.getLat(),
        swLng: sw.getLng(),
        neLat: ne.getLat(),
        neLng: ne.getLng(),
      });
    };

    const onIdle = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(emit, 120);
    };

    kakao.maps.event.addListener(map, "idle", onIdle);
    queueMicrotask(onIdle);

    return () => {
      clearTimeout(timeoutId);
      kakao.maps.event.removeListener(map, "idle", onIdle);
    };
  }, [ready, trackViewportBounds, mapActive]);

  /** 목록에서 미리 마운트 후 지도 탭 시 보이게 전환 */
  useEffect(() => {
    if (!ready || !mapRef.current || !mapActive) return;
    const map = mapRef.current;
    const relayout = () => {
      try {
        map.relayout();
      } catch {
        /* ignore */
      }
    };
    relayout();
    const raf = requestAnimationFrame(() => requestAnimationFrame(relayout));
    const t0 = window.setTimeout(relayout, 0);
    const t1 = window.setTimeout(relayout, 50);
    const t2 = window.setTimeout(relayout, 200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ready, mapActive]);

  /** 컨테이너가 0크기였다가 열리는 경우(목록→지도 전환) 타일이 안 그려지는 문제 — relayout으로 1탭처럼 보이게 함 */
  useEffect(() => {
    if (!ready || !mapRef.current || !containerRef.current) return;
    const map = mapRef.current;
    const container = containerRef.current;

    const relayout = () => {
      try {
        map.relayout();
      } catch {
        /* ignore */
      }
    };

    relayout();
    const raf1 = requestAnimationFrame(relayout);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(relayout));
    const t1 = window.setTimeout(relayout, 50);
    const t2 = window.setTimeout(relayout, 200);
    const ro = new ResizeObserver(() => relayout());
    ro.observe(container);
    window.addEventListener("resize", relayout, { passive: true });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
      window.removeEventListener("resize", relayout);
    };
  }, [ready]);

  const handleMyLocation = useCallback(() => {
    if (!ready || !mapRef.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("이 환경에서는 위치 정보를 사용할 수 없어요");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { kakao } = window;
        const map = mapRef.current;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const latLng = new kakao.maps.LatLng(lat, lng);
        map.setCenter(latLng);
        map.setLevel(4);
        queueMicrotask(() => {
          try {
            map.relayout();
          } catch {
            /* ignore */
          }
        });

        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.setPosition(latLng);
        } else {
          myLocationMarkerRef.current = new kakao.maps.Marker({
            position: latLng,
            map,
          });
        }
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === 1
            ? "위치 권한이 거부되었어요"
            : err.code === 2
              ? "위치를 가져올 수 없어요"
              : err.code === 3
                ? "위치 요청 시간이 초과되었어요"
                : "위치를 가져오지 못했어요";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 }
    );
  }, [ready]);

  return (
    <div className={cn("relative min-h-[250px]", className)}>
      <div ref={containerRef} className="min-h-[250px] h-full w-full" />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-muted">
          <span className="text-sm text-muted-foreground">지도 로딩 중…</span>
        </div>
      )}
      {showMyLocationButton && ready && (
        <button
          type="button"
          onClick={handleMyLocation}
          disabled={locating}
          className={cn(
            "absolute bottom-4 right-4 z-[30] inline-flex touch-manipulation select-none items-center justify-center",
            "h-11 w-11 rounded-full border border-border/90 bg-background/95 text-foreground shadow-md backdrop-blur-sm",
            "transition-[transform,box-shadow] active:scale-[0.97] disabled:opacity-70",
            "[-webkit-tap-highlight-color:transparent]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          )}
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
          aria-label="현재 위치로 이동"
        >
          {locating ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <LocateFixed className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          )}
        </button>
      )}
    </div>
  );
};

export default KakaoMap;
