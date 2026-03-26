"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyRecommend } from "@/hooks/useNearbyRecommend";
import type { KakaoPlace } from "@/lib/kakao";
import { cn } from "@/lib/utils";

const RADIUS_M = 1000;

interface HomeRecommendHeroProps {
  onSelectPlace: (place: KakaoPlace) => void;
}

export default function HomeRecommendHero({ onSelectPlace }: HomeRecommendHeroProps) {
  const { position, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const recommendQuery = useNearbyRecommend(position?.lat ?? null, position?.lng ?? null, RADIUS_M);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    setShowResult(false);
  }, [position?.lat, position?.lng]);

  const data = recommendQuery.data;
  const recommendLoading = position !== null && recommendQuery.isLoading;
  const recommendError = recommendQuery.isError;

  const canRecommend =
    position !== null &&
    !geoLoading &&
    !geoError &&
    !recommendLoading &&
    !recommendError &&
    data?.kind === "ok" &&
    data.places.length > 0;

  const noRecommendMessage =
    position !== null &&
    !geoLoading &&
    !geoError &&
    !recommendLoading &&
    !recommendError &&
    (data?.kind === "no_places" || data?.kind === "no_metadata");

  const handleRecommendClick = useCallback(() => {
    if (!canRecommend || !data) return;
    setShowResult(true);
  }, [canRecommend, data]);

  return (
    <section className="mb-8 rounded-xl border border-border bg-muted/30 p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">근처 한 잔</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          내 위치 기준 1km 안에서 좋아요가 많은 술집을 골라 드려요
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            {geoLoading && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                위치를 확인하는 중이에요…
              </p>
            )}
            {!geoLoading && geoError && (
              <div>
                <p className="text-foreground">{geoError}</p>
                <button
                  type="button"
                  onClick={() => requestLocation()}
                  className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  다시 시도
                </button>
              </div>
            )}
            {!geoLoading && !geoError && position && (
              <p className="text-foreground">
                <span className="text-muted-foreground">현재 위치</span>{" "}
                <span className="font-mono text-xs tabular-nums sm:text-sm">
                  {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                </span>
              </p>
            )}
            {!geoLoading && !geoError && !position && (
              <button
                type="button"
                onClick={() => requestLocation()}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                위치 허용하기
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          disabled={!canRecommend}
          onClick={handleRecommendClick}
          className={cn(
            "flex h-36 w-36 flex-col items-center justify-center gap-1 rounded-full border-2 text-center shadow-md transition-all",
            canRecommend
              ? "border-primary bg-primary text-primary-foreground hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
              : "cursor-not-allowed border-border bg-muted/50 text-muted-foreground opacity-80"
          )}
        >
          {recommendLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-8 w-8" aria-hidden />
          )}
          <span className="px-2 text-sm font-semibold leading-tight">추천 받기</span>
        </button>

        {recommendError && (
          <p className="text-center text-sm text-destructive">추천 정보를 불러오지 못했어요</p>
        )}

        {noRecommendMessage && (
          <p className="text-center text-sm font-medium text-muted-foreground">
            추천할만한 술집이 없습니다
          </p>
        )}

        {showResult && data?.kind === "ok" && data.places.length > 0 && (
          <div className="w-full space-y-2 border-t border-border pt-4">
            <p className="text-center text-xs font-medium text-muted-foreground">
              {data.places.length === 1 ? "이번 추천" : "동점으로 함께 추천해요"}
            </p>
            <ul className="flex flex-col gap-2">
              {data.places.map((place) => {
                const likes = data.metaMap[place.id]?.like_count ?? 0;
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => onSelectPlace(place)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {place.place_name}
                      </span>
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        좋아요 {likes}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
