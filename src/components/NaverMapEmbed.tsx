"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type NaverLatLng = unknown;

type NaverMapInstance = {
  destroy?: () => void;
};

type NaverMarkerInstance = {
  setMap?: (map: NaverMapInstance | null) => void;
};

type NaverMapsApi = {
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Map: new (containerId: string, options: { center: NaverLatLng; zoom: number }) => NaverMapInstance;
  Marker: new (options: { position: NaverLatLng; map: NaverMapInstance }) => NaverMarkerInstance;
};

declare global {
  interface Window {
    naver?: {
      maps?: NaverMapsApi;
    };
  }
}

let naverMapsSdkPromise: Promise<void> | null = null;

function loadNaverMapsSdk(clientId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("window is undefined"));
  if (window.naver?.maps) return Promise.resolve();
  if (naverMapsSdkPromise) return naverMapsSdkPromise;

  naverMapsSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-naver-maps-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Naver Maps SDK script load failed")));
      return;
    }

    const script = document.createElement("script");
    script.dataset.naverMapsSdk = "true";
    // Naver Maps JS SDK v3
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${encodeURIComponent(
      clientId
    )}&submodules=geocoder`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Naver Maps SDK script load failed"));
    document.head.appendChild(script);
  });

  return naverMapsSdkPromise;
}

async function waitForNaverMapsReady(timeoutMs = 10000): Promise<NaverMapsApi> {
  const startedAt = Date.now();
  // Polling is more reliable than relying on `onJSContentLoaded` timing
  // when the SDK is loaded asynchronously.
  while (Date.now() - startedAt < timeoutMs) {
    if (window.naver?.maps?.Map) return window.naver.maps;
    await new Promise((r) => window.setTimeout(r, 50));
  }
  throw new Error("Naver Maps SDK not ready in time");
}

export type NaverMapEmbedProps = {
  clientId: string;
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
};

export default function NaverMapEmbed({
  clientId,
  lat,
  lng,
  zoom = 15,
  className,
}: NaverMapEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerId = useMemo(() => `naver-map-${Math.random().toString(36).slice(2)}`, []);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRef = useRef<NaverMarkerInstance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!clientId?.trim()) {
      setStatus("error");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    setStatus("loading");

    loadNaverMapsSdk(clientId)
      .then(() => {
        if (cancelled) return;
        waitForNaverMapsReady()
          .then((maps) => {
            if (cancelled) return;
            if (!containerRef.current) throw new Error("Naver map container missing");

            // Reset existing overlays
            try {
              markerRef.current?.setMap?.(null);
            } catch {
              // ignore
            }
            try {
              mapRef.current?.destroy?.();
            } catch {
              // ignore
            }

            const center = new maps.LatLng(lat, lng);
            const map = new maps.Map(containerId, { center, zoom });
            const marker = new maps.Marker({ position: center, map });

            mapRef.current = map;
            markerRef.current = marker;
            setStatus("ready");
          })
          .catch((e) => {
            console.error(e);
            if (!cancelled) setStatus("error");
          });
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, lat, lng, zoom, containerId]);

  return (
    <div className={className ?? "relative h-full w-full"}>
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-card/70 text-sm text-muted-foreground backdrop-blur">
          네이버 지도 로딩 중...
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-border bg-card/90 px-3 text-center text-sm text-muted-foreground">
          네이버 지도 표시를 준비하지 못했어요.
        </div>
      )}
      <div ref={containerRef} id={containerId} className="h-full w-full" aria-hidden={status !== "ready"} />
    </div>
  );
}

