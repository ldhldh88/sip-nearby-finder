import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { useBarSearch } from "@/hooks/useBarSearch";
import { KakaoPlace } from "@/lib/kakao";
import { getShortCategory, getCategoryColor } from "@/hooks/useKakaoSearch";

interface SearchBarProps {
  onSelectPlace: (place: KakaoPlace) => void;
}

const SearchBar = ({ onSelectPlace }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: results, isLoading } = useBarSearch(query);

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

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-full p-2 transition-colors hover:bg-muted"
        aria-label="검색"
      >
        <Search className="h-5 w-5 text-foreground" />
      </button>

      {/* Search overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 top-0 z-50 mx-auto max-w-3xl px-4 pt-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="overflow-hidden rounded-2xl bg-card shadow-xl" style={{ boxShadow: "var(--shadow-card-hover)" }}>
                {/* Input */}
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

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading && query.trim().length >= 2 && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}

                  {!isLoading && results && results.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      검색 결과가 없습니다
                    </div>
                  )}

                  {!isLoading && results && results.length > 0 && (
                    <ul>
                      {results.map((place) => {
                        const short = getShortCategory(place.category_name);
                        const color = getCategoryColor(short);
                        return (
                          <li key={place.id}>
                            <button
                              onClick={() => handleSelect(place)}
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                            >
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                                🍺
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-card-foreground truncate">
                                  {place.place_name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                  {place.road_address_name || place.address_name}
                                </p>
                                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
                                  {short}
                                </span>
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
      </AnimatePresence>
    </>
  );
};

export default SearchBar;
