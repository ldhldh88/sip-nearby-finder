import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { useRegions } from "@/hooks/useRegions";
import { useIsMobile } from "@/hooks/use-mobile";

interface RegionSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (province: string, district: string | null) => void;
  selectedProvince: string | null;
  selectedDistrict: string | null;
}

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const RegionSelector = ({ open, onClose, onSelect, selectedProvince, selectedDistrict }: RegionSelectorProps) => {
  const isMobile = useIsMobile();
  const [activeProvince, setActiveProvince] = useState(selectedProvince || "서울");
  const [searchQuery, setSearchQuery] = useState("");

  const activeRegion = useMemo(() => {
    return REGIONS.find((r) => r.province === activeProvince);
  }, [activeProvince]);

  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) return activeRegion?.districts || [];
    const q = searchQuery.trim().toLowerCase();
    // Search across all provinces
    const results: { province: string; district: string }[] = [];
    REGIONS.forEach((r) => {
      r.districts.forEach((d) => {
        if (d.toLowerCase().includes(q) || r.province.replace("\n", "").toLowerCase().includes(q)) {
          results.push({ province: r.province, district: d });
        }
      });
    });
    return results.map((r) => r.district);
  }, [searchQuery, activeRegion]);

  const handleSelectAll = () => {
    onSelect(activeProvince, null);
    onClose();
  };

  const handleSelectDistrict = (district: string) => {
    const province = searchQuery.trim()
      ? REGIONS.find((r) => r.districts.includes(district))?.province || activeProvince
      : activeProvince;
    onSelect(province, district);
    onClose();
  };

  const modalContent = (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onClose} className="rounded-lg p-1 transition-colors hover:bg-muted">
          <X className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-foreground">지역 선택</h2>
      </div>

      {/* Search */}
      <div className="border-b border-border px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="지역명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card"
          />
        </div>
      </div>

      {/* Body - two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Province sidebar */}
        {!searchQuery.trim() && (
          <div className="w-24 flex-shrink-0 overflow-y-auto border-r border-border bg-muted/30">
            {REGIONS.map((region) => (
              <button
                key={region.province}
                onClick={() => setActiveProvince(region.province)}
                className={`w-full px-2 py-3 text-center text-sm font-medium transition-colors whitespace-pre-line leading-tight
                  ${activeProvince === region.province
                    ? "bg-card text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-card/50"
                  }`}
              >
                {region.province}
              </button>
            ))}
          </div>
        )}

        {/* Districts list */}
        <div className="flex-1 overflow-y-auto">
          {!searchQuery.trim() && (
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <span className="text-base font-semibold text-foreground">
                {activeProvince.replace("\n", " ")}
              </span>
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                전체 <span className="text-xs">›</span>
              </button>
            </div>
          )}

          <div>
            {filteredDistricts.map((district) => (
              <button
                key={district}
                onClick={() => handleSelectDistrict(district)}
                className={`w-full px-4 py-3.5 text-left text-[15px] transition-colors hover:bg-muted/50
                  ${selectedDistrict === district
                    ? "font-semibold text-primary"
                    : "text-foreground"
                  }`}
              >
                {district}
              </button>
            ))}
            {filteredDistricts.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-foreground/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {isMobile ? (
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 h-[85svh] rounded-t-2xl bg-card shadow-xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={spring}
            >
              {modalContent}
            </motion.div>
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <motion.div
                className="h-[600px] w-full max-w-2xl rounded-2xl bg-card shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={spring}
              >
                {modalContent}
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default RegionSelector;
