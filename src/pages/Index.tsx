import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import RegionSelector from "@/components/RegionSelector";
import BarCard from "@/components/BarCard";
import SearchBar from "@/components/SearchBar";
import BarDetailSheet from "@/components/BarDetailSheet";
import HotBarSection from "@/components/HotBarSection";
import ThemeFilter from "@/components/ThemeFilter";
import { useKakaoSearch } from "@/hooks/useKakaoSearch";
import { useBarMeta, computePopularity } from "@/hooks/useBarLikeCounts";
import { useThemes, useBarThemes, useThemeFilteredBars } from "@/hooks/useThemes";
import { KakaoPlace } from "@/lib/kakao";
import Footer from "@/components/Footer";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [regionOpen, setRegionOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<KakaoPlace | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  const selectedProvince = searchParams.get("province") || "서울";
  const selectedDistrict = searchParams.get("district") || "강남/역삼/삼성/논현";

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useKakaoSearch(selectedDistrict);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectRegion = (province: string, district: string | null) => {
    const params = new URLSearchParams();
    params.set("province", province);
    if (district) params.set("district", district);
    setSearchParams(params);
  };

  const regionLabel = selectedDistrict
    ? selectedDistrict
    : selectedProvince
      ? `${selectedProvince.replace("\n", " ")} 전체`
      : "지역 선택";

  // Flatten all pages into one list
  const allPlaces = useMemo(
    () => data?.pages.flatMap((p) => p.places) ?? [],
    [data]
  );
  const total = data?.pages[0]?.total ?? 0;

  // Fetch themes data
  const { data: allThemes } = useThemes();
  const placeIds = useMemo(() => allPlaces.map((p) => p.id), [allPlaces]);
  const { data: barThemesMap } = useBarThemes(placeIds);
  const { data: barMetaMap } = useBarMeta(placeIds);

  // DB-level theme filtering: fetch bars with the selected theme in this district
  const { data: themeFilterData, isLoading: isThemeLoading } = useThemeFilteredBars(
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

  // When theme is selected, show DB-queried results; otherwise show all cached
  const filteredPlaces = useMemo(() => {
    if (!selectedThemeId) return allPlaces;
    if (themeFilterData?.places) return themeFilterData.places;
    return [];
  }, [allPlaces, selectedThemeId, themeFilterData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 h-14 border-b border-border backdrop-blur-md bg-background/80">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
              {/* Glass */}
              <path d="M18 28c0-2 2-4 4-4h20c2 0 4 2 4 4l-3 22c-.5 3-3 5-6 5H27c-3 0-5.5-2-6-5L18 28z" fill="hsl(var(--primary))" opacity="0.85"/>
              <path d="M20 28h24l-2.5 20c-.4 2.4-2.4 4-4.8 4H27.3c-2.4 0-4.4-1.6-4.8-4L20 28z" fill="hsl(var(--primary))" opacity="0.5"/>
              {/* Liquid */}
              <path d="M21.5 34h21l-2 14c-.3 2-2 3.5-4 3.5h-9c-2 0-3.7-1.5-4-3.5l-2-14z" fill="hsl(var(--primary))" opacity="0.7"/>
              {/* Flame center */}
              <path d="M32 6c0 0-8 6-8 14 0 5 3.5 8 8 8s8-3 8-8c0-8-8-14-8-14z" fill="#FF6B35"/>
              <path d="M32 12c0 0-4 3.5-4 8 0 3 1.8 4.5 4 4.5s4-1.5 4-4.5c0-4.5-4-8-4-8z" fill="#FFD93D"/>
              <path d="M32 17c0 0-2 2-2 4.5c0 1.5.9 2.5 2 2.5s2-1 2-2.5c0-2.5-2-4.5-2-4.5z" fill="#FFF3B0"/>
              {/* Cute face on glass */}
              <circle cx="28" cy="40" r="1.5" fill="hsl(var(--primary-foreground))"/>
              <circle cx="36" cy="40" r="1.5" fill="hsl(var(--primary-foreground))"/>
              <path d="M29.5 44c1.2 1.2 3.8 1.2 5 0" stroke="hsl(var(--primary-foreground))" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              {/* Cheek blush */}
              <circle cx="25.5" cy="42" r="2" fill="#FF9999" opacity="0.5"/>
              <circle cx="38.5" cy="42" r="2" fill="#FF9999" opacity="0.5"/>
            </svg>
            <span className="text-lg font-bold tracking-tight text-foreground">파이어플레이스</span>
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
        <HotBarSection onSelectPlace={(place) => setDetailPlace(place)} />
        <ThemeFilter selectedThemeId={selectedThemeId} onSelect={setSelectedThemeId} />

        {/* Result count */}
        {data && !isLoading && !selectedThemeId && (
          <p className="mb-4 text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{total.toLocaleString()}</span>개의 술집
          </p>
        )}
        {selectedThemeId && themeFilterData && (
          <p className="mb-4 text-sm text-muted-foreground">
            테마 필터 결과 <span className="font-semibold text-foreground">{filteredPlaces.length}</span>개의 술집
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
          <div className="flex flex-col gap-3">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place, i) => (
                <BarCard
                  key={place.id}
                  place={place}
                  index={i}
                  onClick={() => setDetailPlace(place)}
                  likeCount={likeCounts?.[place.id] ?? 0}
                  themes={
                    mergedThemesMap?.[place.id]
                      ?.map((tid) => themeLookup[tid])
                      .filter(Boolean) ?? []
                  }
                />
              ))
            ) : (
              <div className="py-20 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  이 지역의 술집 정보를 찾지 못했어요
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  다른 지역을 선택해 보세요
                </p>
              </div>
            )}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />

        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {data && !hasNextPage && allPlaces.length > 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            모든 술집을 불러왔어요 🍻
          </p>
        )}
      </main>

      <Footer />

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
