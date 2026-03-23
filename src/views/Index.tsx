import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import RegionSelector from "@/components/RegionSelector";
import BarCard from "@/components/BarCard";
import SearchBar from "@/components/SearchBar";
import BarDetailSheet from "@/components/BarDetailSheet";
import HotBarSection from "@/components/HotBarSection";
import ThemeFilter from "@/components/ThemeFilter";
import RegionStrip from "@/components/RegionStrip";
import KakaoMap from "@/components/KakaoMap";
import { useDistrictBars } from "@/hooks/useDistrictBars";
import { usePlacesInBounds } from "@/hooks/usePlacesInBounds";
import { useThemes, useBarThemes, useThemeFilteredBars } from "@/hooks/useThemes";
import { KakaoPlace } from "@/lib/kakao";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import ViewModeFab from "@/components/ViewModeFab";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  filterPlacesByViewport,
  type MapViewportBounds,
} from "@/lib/mapViewport";

/** 지역 맵 폴백 중심 (강남 일대) */
const DEFAULT_DISTRICT_MAP_CENTER = { lat: 37.498095, lng: 127.027612 };

const Index = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [regionOpen, setRegionOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<KakaoPlace | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mapViewportBounds, setMapViewportBounds] = useState<MapViewportBounds | null>(null);
  /** API 호출 디바운스 — idle 이벤트가 잦을 때 요청 수 제한 */
  const [debouncedMapBounds, setDebouncedMapBounds] = useState<MapViewportBounds | null>(null);
  const queryClient = useQueryClient();

  const selectedProvince = searchParams.get("province") || "서울";
  const selectedDistrict = searchParams.get("district") || "강남/역삼/삼성/논현";

  const {
    data: districtData,
    isLoading,
    isError,
  } = useDistrictBars(selectedDistrict);

  const allPlaces = districtData?.places ?? [];
  const barMetaMap = districtData?.metaMap ?? {};

  const handleSelectRegion = (province: string, district: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("province", province);
    if (district) params.set("district", district);
    else params.delete("district");
    router.push(`/?${params.toString()}`);
  };

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      // Find district ID
      const location = selectedDistrict.split("/")[0]?.trim();
      const { data: districts } = await supabase
        .from("districts")
        .select("id")
        .ilike("name", `%${location}%`)
        .limit(1);
      const districtId = districts?.[0]?.id;
      if (!districtId) {
        toast.error("지역을 찾을 수 없어요");
        return;
      }

      const syncRes = await fetch("/api/sync-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district_id: districtId }),
      });
      if (!syncRes.ok) {
        const errBody = await syncRes.json().catch(() => ({}));
        throw new Error(
          typeof errBody === "object" && errBody && "error" in errBody
            ? String((errBody as { error?: string }).error)
            : `sync failed: ${syncRes.status}`
        );
      }

      toast.success("동기화 완료! 리스트를 새로고침합니다");
      queryClient.invalidateQueries({ queryKey: ["district-bars"] });
    } catch (e) {
      toast.error("동기화에 실패했어요");
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedDistrict, isSyncing, queryClient]);

  const regionLabel = selectedDistrict
    ? selectedDistrict
    : selectedProvince
      ? `${selectedProvince.replace("\n", " ")} 전체`
      : "지역 선택";

  // Fetch themes data
  const { data: allThemes } = useThemes();
  const placeIds = useMemo(() => allPlaces.map((p) => p.id), [allPlaces]);
  const { data: barThemesMap } = useBarThemes(placeIds);

  // DB-level theme filtering
  const { data: themeFilterData } = useThemeFilteredBars(
    selectedThemeId,
    selectedDistrict
  );

  const themeLookup = useMemo(() => {
    const map: Record<string, { id: string; name: string; icon_url: string | null }> = {};
    for (const t of allThemes || []) map[t.id] = t;
    return map;
  }, [allThemes]);

  // Merge theme maps
  const mergedThemesMap = useMemo(() => {
    const merged = { ...barThemesMap };
    if (themeFilterData?.themeMap) {
      for (const [id, themes] of Object.entries(themeFilterData.themeMap)) {
        if (!merged[id]) merged[id] = [];
        for (const t of themes) {
          if (!merged[id].includes(t)) merged[id].push(t);
        }
      }
    }
    return merged;
  }, [barThemesMap, themeFilterData]);

  // When theme is selected, show DB-queried results; otherwise show all (already sorted by DB)
  const filteredPlaces = useMemo(() => {
    if (selectedThemeId) return themeFilterData?.places ?? [];
    return allPlaces;
  }, [allPlaces, selectedThemeId, themeFilterData]);

  useEffect(() => {
    setMapViewportBounds(null);
  }, [selectedDistrict, selectedThemeId]);

  useEffect(() => {
    if (viewMode === "list") setMapViewportBounds(null);
  }, [viewMode]);

  useEffect(() => {
    if (!mapViewportBounds) {
      setDebouncedMapBounds(null);
      return;
    }
    const t = window.setTimeout(() => setDebouncedMapBounds(mapViewportBounds), 320);
    return () => window.clearTimeout(t);
  }, [mapViewportBounds]);

  const boundsInMapQuery = usePlacesInBounds(debouncedMapBounds, {
    enabled: viewMode === "map" && debouncedMapBounds !== null,
    themeId: selectedThemeId,
  });

  const mapPlacesForViewport = useMemo(() => {
    if (viewMode !== "map") return filteredPlaces;
    if (!mapViewportBounds) return filteredPlaces;
    return filterPlacesByViewport(filteredPlaces, mapViewportBounds);
  }, [viewMode, filteredPlaces, mapViewportBounds]);

  const onMapViewportBoundsChange = useCallback((b: MapViewportBounds) => {
    setMapViewportBounds(b);
  }, []);

  /** 지도 마커: bounds API 성공 시 DB 전역 캐시 결과, 아니면 선택 구역+클라이언트 필터 */
  const mapPlacesForMap = useMemo(() => {
    if (viewMode !== "map") return filteredPlaces;
    if (
      debouncedMapBounds !== null &&
      boundsInMapQuery.data !== undefined &&
      !boundsInMapQuery.isError
    ) {
      return boundsInMapQuery.data.places;
    }
    return mapPlacesForViewport;
  }, [
    viewMode,
    filteredPlaces,
    debouncedMapBounds,
    boundsInMapQuery.data,
    boundsInMapQuery.isError,
    mapPlacesForViewport,
  ]);

  const listBody = (
    <>
      <div className="mb-8 space-y-8">
        <SearchBar
          variant="hero"
          placeholder="오늘 어떤 분위기로 마실까요?"
          onSelectPlace={(place) => setDetailPlace(place)}
        />
        <ThemeFilter
          variant="home"
          selectedThemeId={selectedThemeId}
          onSelect={setSelectedThemeId}
        />
        <RegionStrip
          selectedProvince={selectedProvince}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(province, district) => handleSelectRegion(province, district)}
          onOpenSelector={() => setRegionOpen(true)}
        />
      </div>

      <HotBarSection onSelectPlace={(place) => setDetailPlace(place)} />

      {/* Result count + Sync button */}
      {!isLoading && !selectedThemeId && allPlaces.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            총 <span className="font-semibold text-neutral-900">{allPlaces.length.toLocaleString()}</span>개의 술집
          </p>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "동기화 중…" : "데이터 갱신"}
          </button>
        </div>
      )}
      {selectedThemeId && themeFilterData && (
        <p className="mb-4 text-sm text-neutral-500">
          테마 필터 결과 <span className="font-semibold text-neutral-900">{filteredPlaces.length}</span>개의 술집
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
          <p className="mt-3 text-sm text-neutral-500">술집을 찾고 있어요…</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-neutral-900">데이터를 불러오지 못했어요</p>
          <p className="mt-1 text-sm text-neutral-500">잠시 후 다시 시도해 주세요</p>
        </div>
      )}

      {/* Bar List */}
      {!isLoading && !isError && (
        <div className="flex flex-col gap-3">
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place, i) => (
              <BarCard
                key={place.id}
                place={place}
                index={i}
                onClick={() => setDetailPlace(place)}
                likeCount={barMetaMap[place.id]?.like_count ?? 0}
                themes={
                  mergedThemesMap?.[place.id]
                    ?.map((tid) => themeLookup[tid])
                    .filter(Boolean) ?? []
                }
              />
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-neutral-600">이 지역의 술집 정보를 찾지 못했어요</p>
              <p className="mt-1 text-sm text-neutral-500">다른 지역을 선택해 보세요</p>
            </div>
          )}
        </div>
      )}

      {!isLoading && allPlaces.length > 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">모든 술집을 불러왔어요</p>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 h-14 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0"
              aria-hidden
            />
            <span className="truncate text-lg font-semibold leading-none tracking-[-0.02em] text-neutral-900">
              FirePlace
            </span>
            <span className="hidden shrink-0 border border-neutral-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600 sm:inline">
              Beta
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <p
              className="hidden max-w-[min(12rem,40vw)] truncate text-right text-xs text-neutral-500 sm:block"
              title={regionLabel}
            >
              {regionLabel}
            </p>
            <button
              type="button"
              onClick={() => setRegionOpen(true)}
              className="flex shrink-0 items-center justify-center rounded-full border border-neutral-300 p-2.5 text-neutral-900 transition-colors hover:bg-neutral-100"
              aria-label="지역 선택"
            >
              <MapPin className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 데이터 준비 후 지도를 목록과 동시에 마운트(숨김) → 지도 탭 시 바로 표시 */}
      {!isLoading && !isError && (
        <div
          className={cn(
            "fixed left-0 right-0 top-14 z-[5] h-[calc(100dvh-3.5rem)] w-full",
            viewMode === "list"
              ? "pointer-events-none invisible opacity-0"
              : "z-[20] opacity-100"
          )}
          aria-hidden={viewMode === "list"}
        >
          <div className="relative h-full w-full">
            <KakaoMap
              center={DEFAULT_DISTRICT_MAP_CENTER}
              places={mapPlacesForMap}
              fitBoundsSource={filteredPlaces}
              onSelectPlace={(place) => setDetailPlace(place as KakaoPlace)}
              markerVariant="pill"
              showUserMarker={false}
              fitBoundsToPlaces={filteredPlaces.length > 0}
              mapActive={viewMode === "map"}
              trackViewportBounds={viewMode === "map"}
              onViewportBoundsChange={onMapViewportBoundsChange}
              showMyLocationButton={viewMode === "map"}
              className="h-full w-full min-h-0"
            />
            {filteredPlaces.length === 0 && (
              <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                <div className="max-w-sm border border-neutral-200 bg-white/95 px-4 py-3 text-center text-sm text-neutral-600 backdrop-blur-sm">
                  이 지역에 표시할 술집이 없어요
                </div>
              </div>
            )}
            {filteredPlaces.length > 0 &&
              mapPlacesForMap.length === 0 &&
              viewMode === "map" &&
              mapViewportBounds !== null && (
                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                  <div className="max-w-sm border border-neutral-200 bg-white/95 px-4 py-3 text-center text-sm text-neutral-600 backdrop-blur-sm">
                    이 화면 범위에 술집이 없어요 · 지도를 움직여 보세요
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {viewMode === "map" && isLoading && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-[20] flex flex-col items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
          <p className="mt-3 text-sm text-neutral-500">술집을 찾고 있어요…</p>
        </div>
      )}

      {viewMode === "map" && isError && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-[20] flex flex-col items-center justify-center bg-white px-4 text-center">
          <p className="text-lg font-medium text-neutral-900">데이터를 불러오지 못했어요</p>
          <p className="mt-1 text-sm text-neutral-500">잠시 후 다시 시도해 주세요</p>
        </div>
      )}

      <main
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-1 flex-col min-h-0",
          viewMode === "list"
            ? "relative z-10 bg-white px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]"
            : "relative z-0 max-w-none min-h-0 p-0"
        )}
      >
        {viewMode === "list" ? (
          listBody
        ) : (
          <div
            className="pointer-events-none h-[calc(100dvh-3.5rem)] w-full shrink-0"
            aria-hidden
          />
        )}
      </main>

      {viewMode === "list" && (
        <div className="relative z-10 bg-white">
          <Footer />
        </div>
      )}

      <ViewModeFab
        viewMode={viewMode}
        onSwitchToMap={() => setViewMode("map")}
        onSwitchToList={() => setViewMode("list")}
        hidden={!!detailPlace || regionOpen}
      />

      <RegionSelector
        open={regionOpen}
        onClose={() => setRegionOpen(false)}
        onSelect={handleSelectRegion}
        selectedProvince={selectedProvince}
        selectedDistrict={selectedDistrict}
      />

      <BarDetailSheet
        place={detailPlace}
        onClose={() => setDetailPlace(null)}
      />
    </div>
  );
};

export default Index;
