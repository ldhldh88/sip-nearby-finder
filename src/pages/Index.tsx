import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Wine } from "lucide-react";
import RegionSelector from "@/components/RegionSelector";
import BarCard from "@/components/BarCard";
import { SAMPLE_BARS } from "@/data/regions";

const Index = () => {
  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>("서울");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>("강남/역삼/삼성/논현");
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  const handleSelectRegion = (province: string, district: string | null) => {
    setSelectedProvince(province);
    setSelectedDistrict(district);
  };

  const regionLabel = selectedDistrict
    ? selectedDistrict
    : selectedProvince
      ? `${selectedProvince.replace("\n", " ")} 전체`
      : "지역 선택";

  const filteredBars = useMemo(() => {
    let bars = SAMPLE_BARS;
    if (selectedDistrict) {
      bars = bars.filter((b) => b.district === selectedDistrict);
    }
    return [...bars].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      return parseInt(a.distance) - parseInt(b.distance);
    });
  }, [selectedDistrict, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 h-14 border-b border-border backdrop-blur-md bg-background/80">
        <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wine className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">술자리</span>
          </div>

          <button
            onClick={() => setRegionOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-95 hover:scale-105"
            style={{ boxShadow: "var(--shadow-primary)" }}
          >
            {regionLabel.length > 12 ? regionLabel.slice(0, 12) + "…" : regionLabel}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-5">
        {/* Sort buttons */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setSortBy("distance")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors
              ${sortBy === "distance"
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
          >
            거리순
          </button>
          <button
            onClick={() => setSortBy("rating")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors
              ${sortBy === "rating"
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
          >
            평점순
          </button>
        </div>

        {/* Bar List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedProvince}-${selectedDistrict}-${sortBy}`}
            className="flex flex-col gap-3"
          >
            {filteredBars.length > 0 ? (
              filteredBars.map((bar, i) => (
                <BarCard key={bar.id} bar={bar} index={i} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <p className="text-lg font-medium text-muted-foreground">
                  이 지역의 술집 정보를 준비 중이에요
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  다른 지역을 선택해 보세요
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Region Selector Modal */}
      <RegionSelector
        open={regionOpen}
        onClose={() => setRegionOpen(false)}
        onSelect={handleSelectRegion}
        selectedProvince={selectedProvince}
        selectedDistrict={selectedDistrict}
      />
    </div>
  );
};

export default Index;
