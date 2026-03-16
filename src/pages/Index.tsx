import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Wine, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import RegionSelector from "@/components/RegionSelector";
import BarCard from "@/components/BarCard";
import SearchBar from "@/components/SearchBar";
import BarDetailSheet from "@/components/BarDetailSheet";
import HotBarSection from "@/components/HotBarSection";
import { useKakaoSearch, ITEMS_PER_PAGE } from "@/hooks/useKakaoSearch";
import { KakaoPlace } from "@/lib/kakao";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [regionOpen, setRegionOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<KakaoPlace | null>(null);

  // Read state from URL
  const selectedProvince = searchParams.get("province") || "서울";
  const selectedDistrict = searchParams.get("district") || "강남/역삼/삼성/논현";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, isError, isFetching } = useKakaoSearch(
    selectedDistrict,
    currentPage
  );

  const handleSelectRegion = (province: string, district: string | null) => {
    const params = new URLSearchParams();
    params.set("province", province);
    if (district) params.set("district", district);
    params.set("page", "1");
    setSearchParams(params);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const regionLabel = selectedDistrict
    ? selectedDistrict
    : selectedProvince
      ? `${selectedProvince.replace("\n", " ")} 전체`
      : "지역 선택";

  const places = data?.places ?? [];
  const total = data?.total ?? 0;
  const pageableCount = data?.pageableCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

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
        {/* Hot Bars Section */}
        <HotBarSection onSelectPlace={(place) => setDetailPlace(place)} />

        {/* Result count */}
        {data && !isLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{total.toLocaleString()}</span>개의 술집
            {pageableCount < total && (
              <span className="ml-1 text-xs">(검색 가능: {pageableCount}개)</span>
            )}
            <span className="ml-1">
              · 페이지 {currentPage} / {totalPages}
            </span>
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
              key={`${selectedDistrict}-${currentPage}`}
              className="flex flex-col gap-3"
            >
              {places.length > 0 ? (
                places.map((place, i) => (
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

        {/* Fetching overlay */}
        {isFetching && !isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {/* Pagination */}
        {data && totalPages > 1 && !isLoading && (
          <nav className="mt-8 flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers()[0] > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToPage(1)}
                  className="h-9 w-9 text-sm"
                >
                  1
                </Button>
                {getPageNumbers()[0] > 2 && (
                  <span className="px-1 text-muted-foreground">…</span>
                )}
              </>
            )}

            {getPageNumbers().map((p) => (
              <Button
                key={p}
                variant={p === currentPage ? "default" : "ghost"}
                size="icon"
                onClick={() => goToPage(p)}
                className="h-9 w-9 text-sm"
              >
                {p}
              </Button>
            ))}

            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <>
                {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                  <span className="px-1 text-muted-foreground">…</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToPage(totalPages)}
                  className="h-9 w-9 text-sm"
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
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
