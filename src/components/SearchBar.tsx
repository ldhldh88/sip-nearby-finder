"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, MapPin } from "lucide-react";
import { useBarSearch } from "@/hooks/useBarSearch";
import { KakaoPlace } from "@/lib/kakao";
import { getShortCategory, getCategoryColor } from "@/hooks/useKakaoSearch";
import PlaceThumbnail from "@/components/PlaceThumbnail";
import { usePlaceDistricts } from "@/hooks/usePlaceDistricts";

interface SearchBarProps {
  onSelectPlace: (place: KakaoPlace) => void;
}

const SearchBar = ({ onSelectPlace }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: results, isLoading, isError } = useBarSearch(query);

  const placeIds = useMemo(
    () => (results || []).map((p) => p.id),
    [results]
  );
  const { data: districtMap } = usePlaceDistricts(placeIds);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = (place: KakaoPlace) => {
    setOpen(false);
    setQuery("");
    onSelectPlace(place);
  };

  /** 헤더의 backdrop-blur 등이 있으면 fixed 자식이 뷰포트가 아닌 헤더 박스에 묶여 패널·결과가 잘릴 수 있어 body로 포털링 */
  const overlay =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[100] bg-foreground/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 top-0 z-[100] mx-auto max-w-3xl px-4 pt-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="overflow-hidden rounded-2xl bg-card shadow-xl" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="술집 이름으로 검색…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-muted">
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading && query.trim().length >= 2 && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}

                  {isError && query.trim().length >= 2 && (
                    <div className="py-8 text-center text-sm text-destructive">
                      검색을 불러오지 못했어요
                    </div>
                  )}

                  {!isLoading && !isError && results && results.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      검색 결과가 없습니다
                    </div>
                  )}

                  {!isLoading && !isError && results && results.length > 0 && (
                    <ul>
                      {results.map((place) => {
                        const short = getShortCategory(place.category_name);
                        const color = getCategoryColor(short);
                        const districtInfo = districtMap?.[place.id];

                        return (
                          <li key={place.id}>
                            <button
                              onClick={() => handleSelect(place)}
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                            >
                              <PlaceThumbnail
                                placeId={place.id}
                                placeName={place.place_name}
                                className="h-10 w-10 flex-shrink-0 rounded-lg"
                                fallbackSize="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-card-foreground truncate">
                                  {place.place_name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                  {place.road_address_name || place.address_name}
                                </p>
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  {districtInfo ? (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {districtInfo.districtName}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                      <MapPin className="h-2.5 w-2.5" />
                                      미등록
                                    </span>
                                  )}
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
                                    {short}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {query.trim().length < 2 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      2글자 이상 입력해 주세요
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full p-2 transition-colors hover:bg-muted"
        aria-label="검색"
      >
        <Search className="h-5 w-5 text-foreground" />
      </button>

      {overlay}
    </>
  );
};

export default SearchBar;
