import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Flame, Loader2, LocateFixed, AlertCircle } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyBars, HotPlace } from "@/hooks/useNearbyBars";
import { KakaoPlace } from "@/lib/kakao";
import KakaoMap from "@/components/KakaoMap";
import HotBarCard from "@/components/HotBarCard";
import { Button } from "@/components/ui/button";

type SortMode = "hot" | "distance";
const RADIUS_OPTIONS = [500, 1000, 2000] as const;

interface HotBarSectionProps {
  onSelectPlace: (place: KakaoPlace) => void;
}

const HotBarSection = ({ onSelectPlace }: HotBarSectionProps) => {
  const { position, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const [radius, setRadius] = useState<number>(2000);
  const [sortMode, setSortMode] = useState<SortMode>("hot");

  const { data, isLoading, isError } = useNearbyBars(
    position?.lat ?? null,
    position?.lng ?? null,
    radius
  );

  const handleSelectPlace = useCallback(
    (place: HotPlace) => {
      // Convert HotPlace to KakaoPlace for the detail sheet
      onSelectPlace(place as unknown as KakaoPlace);
    },
    [onSelectPlace]
  );

  const sortedPlaces = (() => {
    if (!data?.places) return [];
    const list = [...data.places];
    if (sortMode === "distance") {
      list.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }
    // default: already sorted by hotScore
    return list;
  })();

  // Not activated yet
  if (!position && !geoLoading && !geoError) {
    return (
      <section className="mb-6">
        <button
          onClick={requestLocation}
          className="flex w-full items-center gap-3 border border-dashed border-neutral-300 bg-neutral-50 p-4 transition-colors hover:bg-neutral-100"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white">
            <Flame className="h-5 w-5 text-neutral-900" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-neutral-900">지금 핫한 술집 찾기</p>
            <p className="text-xs text-neutral-500">현재 위치 기반으로 주변 인기 술집을 추천해드려요</p>
          </div>
          <LocateFixed className="ml-auto h-5 w-5 text-neutral-700" />
        </button>
      </section>
    );
  }

  return (
    <section className="mb-6">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-neutral-900" />
          <h2 className="text-base font-bold text-neutral-900">지금 핫한 술집</h2>
        </div>
        <button
          onClick={requestLocation}
          className="flex items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          위치 갱신
        </button>
      </div>

      {/* Loading geo */}
      {geoLoading && (
        <div className="flex items-center gap-2 border border-neutral-200 bg-neutral-50 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-neutral-900" />
          <span className="text-sm text-neutral-600">위치를 확인하고 있어요…</span>
        </div>
      )}

      {/* Geo error */}
      {geoError && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{geoError}</span>
          <Button variant="ghost" size="sm" onClick={requestLocation} className="ml-auto text-xs">
            다시 시도
          </Button>
        </div>
      )}

      {/* Content */}
      {position && (
        <>
          {/* Filters */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            {/* Radius filter */}
            <div className="flex overflow-hidden rounded-full border border-neutral-300">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    radius === r
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>

            {/* Sort filter */}
            <div className="flex overflow-hidden rounded-full border border-neutral-300">
              <button
                onClick={() => setSortMode("hot")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortMode === "hot"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                핫한 순
              </button>
              <button
                onClick={() => setSortMode("distance")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortMode === "distance"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                거리순
              </button>
            </div>
          </div>

          {/* Map */}
          <div className="mb-3 overflow-hidden border border-neutral-200">
            <KakaoMap
              center={position}
              places={sortedPlaces}
              onSelectPlace={handleSelectPlace}
              className="h-[250px] w-full"
            />
          </div>

          {/* Loading bars */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="rounded-xl bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">주변 술집을 불러오지 못했어요</p>
            </div>
          )}

          {/* Results */}
          {data && !isLoading && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${radius}-${sortMode}`}
                className="flex flex-col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {sortedPlaces.length > 0 ? (
                  sortedPlaces.map((place, i) => (
                    <HotBarCard
                      key={place.id}
                      place={place}
                      rank={i + 1}
                      onClick={() => handleSelectPlace(place)}
                    />
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-neutral-500">
                    반경 내 술집이 없어요. 범위를 넓혀보세요.
                  </p>
                )}

                {sortedPlaces.length > 0 && (
                  <p className="mt-1 text-center text-[10px] text-neutral-400">
                    총 {data.total}개 중 상위 {sortedPlaces.length}개 · hotScore 기준
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </section>
  );
};

export default HotBarSection;
