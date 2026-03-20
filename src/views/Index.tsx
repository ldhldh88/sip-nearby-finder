import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import RegionSelector from "@/components/RegionSelector";
import BarCard from "@/components/BarCard";
import SearchBar from "@/components/SearchBar";
import BarDetailSheet from "@/components/BarDetailSheet";
import HotBarSection from "@/components/HotBarSection";
import ThemeFilter from "@/components/ThemeFilter";
import { useDistrictBars } from "@/hooks/useDistrictBars";
import { useThemes, useBarThemes, useThemeFilteredBars } from "@/hooks/useThemes";
import { KakaoPlace } from "@/lib/kakao";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const Index = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [regionOpen, setRegionOpen] = useState(false);
  const [detailPlace, setDetailPlace] = useState<KakaoPlace | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
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

      const { error } = await supabase.functions.invoke("sync-places", {
        body: { district_id: districtId },
      });
      if (error) throw error;

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

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 h-14 border-b border-border backdrop-blur-md bg-background/80">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0"
              aria-hidden
            />
            <span className="text-lg font-semibold leading-none tracking-[-0.02em] text-foreground">
              FirePlace
            </span>
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

        {/* Result count + Sync button */}
        {!isLoading && !selectedThemeId && allPlaces.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 <span className="font-semibold text-foreground">{allPlaces.length.toLocaleString()}</span>개의 술집
            </p>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "동기화 중…" : "데이터 갱신"}
            </button>
          </div>
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

        {!isLoading && allPlaces.length > 0 && (
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
