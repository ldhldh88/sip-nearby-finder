import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Wine, Loader2 } from "lucide-react";
import RegionSelector from "@/components/RegionSelector";
import BarCard from "@/components/BarCard";
import SearchBar from "@/components/SearchBar";
import BarDetailSheet from "@/components/BarDetailSheet";
import { useKakaoSearch } from "@/hooks/useKakaoSearch";
import { KakaoPlace } from "@/lib/kakao";

const ITEMS_PER_PAGE = 20;

const Index = () => {
  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>("서울");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>("강남/역삼/삼성/논현");
  const [detailPlace, setDetailPlace] = useState<KakaoPlace | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const { data, isLoading, isError } = useKakaoSearch(selectedDistrict);

  const handleSelectRegion = (province: string, district: string | null) => {
    setSelectedProvince(province);
    setSelectedDistrict(district);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const regionLabel = selectedDistrict
    ? selectedDistrict
    : selectedProvince
      ? `${selectedProvince.replace("\n", " ")} 전체`
      : "지역 선택";

  const allPlaces = data?.places ?? [];
  const total = data?.total ?? 0;
  const visiblePlaces = allPlaces.slice(0, visibleCount);
  const hasMore = visibleCount < allPlaces.length;

  // Infinite scroll observer (client-side pagination of loaded results)
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 h-14 border-b border-border backdrop-blur-md bg-background/80">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wine className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">오늘 술집 어디</span>
          </div>

          <div className="flex items-center gap-2">
            <SearchBar onSelectPlace={(place) => setDetailPlace(place)} />

            <button
              onClick={() => setRegionOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-95 hover:scale-105"
              style={{ boxShadow: "var(--shadow-primary)" }}
            >
              {regionLabel.length > 12 ? regionLabel.slice(0, 12) + "…" : regionLabel}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-5">
        {/* Result count */}
        {data && !isLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{total}</span>개의 술집
            {visibleCount < allPlaces.length && (
              <span className="ml-1">({visibleCount}개 표시 중)</span>
            )}
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">술집을 찾고 있어요…</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-destructive">데이터를 불러오지 못했어요</p>
            <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해 주세요</p>
          </div>
        )}

        {/* Bar List */}
        {data && !isLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedProvince}-${selectedDistrict}`}
              className="flex flex-col gap-3"
            >
              {visiblePlaces.length > 0 ? (
                visiblePlaces.map((place, i) => (
                  <BarCard
                    key={place.id}
                    place={place}
                    index={i}
                    onClick={() => setDetailPlace(place)}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center"
                >
                  <p className="text-lg font-medium text-muted-foreground">
                    이 지역의 술집 정보를 찾지 못했어요
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    다른 지역을 선택해 보세요
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />

        {/* Loading more indicator */}
        {hasMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </main>

      {/* Region Selector Modal */}
      <RegionSelector
        open={regionOpen}
        onClose={() => setRegionOpen(false)}
        onSelect={handleSelectRegion}
        selectedProvince={selectedProvince}
        selectedDistrict={selectedDistrict}
      />

      {/* Bar Detail Sheet */}
      <BarDetailSheet
        place={detailPlace}
        onClose={() => setDetailPlace(null)}
      />
    </div>
  );
};

export default Index;
