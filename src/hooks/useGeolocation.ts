import { useState, useCallback } from "react";

interface GeoPosition {
  lat: number;
  lng: number;
}

interface GeolocationState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ position: null, error: "이 브라우저에서는 위치 서비스를 지원하지 않습니다.", loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        let msg = "위치를 가져올 수 없습니다.";
        if (err.code === err.PERMISSION_DENIED) msg = "위치 접근 권한이 거부되었습니다.";
        else if (err.code === err.TIMEOUT) msg = "위치 요청 시간이 초과되었습니다.";
        setState({ position: null, error: msg, loading: false });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, requestLocation };
}
