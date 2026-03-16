import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, ExternalLink, Navigation } from "lucide-react";
import { KakaoPlace } from "@/lib/kakao";
import { getShortCategory, getCategoryColor } from "@/hooks/useKakaoSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import PlaceThumbnail from "@/components/PlaceThumbnail";

interface BarDetailSheetProps {
  place: KakaoPlace | null;
  onClose: () => void;
}

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

const BarDetailSheet = ({ place, onClose }: BarDetailSheetProps) => {
  const isMobile = useIsMobile();

  if (!place) return null;

  const shortCategory = getShortCategory(place.category_name);
  const colorClass = getCategoryColor(shortCategory);
  const mapSrc = `https://map.kakao.com/link/map/${place.place_name},${place.y},${place.x}`;
  const staticMapUrl = `https://dapi.kakao.com/v2/maps/open/staticmap?center=${place.x},${place.y}&level=3&w=600&h=300&markers=color:red|label:|pos:${place.x} ${place.y}`;

  return (
    <AnimatePresence>
      {place && (
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
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85svh] overflow-y-auto rounded-t-2xl bg-card shadow-xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={spring}
            >
              <SheetContent place={place} onClose={onClose} shortCategory={shortCategory} colorClass={colorClass} mapSrc={mapSrc} />
            </motion.div>
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <motion.div
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={spring}
              >
                <SheetContent place={place} onClose={onClose} shortCategory={shortCategory} colorClass={colorClass} mapSrc={mapSrc} />
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

function SheetContent({
  place,
  onClose,
  shortCategory,
  colorClass,
  mapSrc,
}: {
  place: KakaoPlace;
  onClose: () => void;
  shortCategory: string;
  colorClass: string;
  mapSrc: string;
}) {
  return (
    <div className="flex flex-col">
      {/* Handle bar for mobile */}
      <div className="flex justify-center pt-3 pb-1 md:hidden">
        <div className="h-1 w-10 rounded-full bg-muted" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <PlaceThumbnail
            placeId={place.id}
            placeName={place.place_name}
            className="h-14 w-14 flex-shrink-0 rounded-xl"
            fallbackSize="md"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-card-foreground truncate">{place.place_name}</h2>
            <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
              {shortCategory}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-muted">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Map preview */}
      <div className="mx-5 overflow-hidden rounded-xl border border-border">
        <a href={mapSrc} target="_blank" rel="noopener noreferrer" className="block">
          <iframe
            src={`https://map.kakao.com/link/map/${encodeURIComponent(place.place_name)},${place.y},${place.x}`}
            width="100%"
            height="200"
            className="border-0 pointer-events-none"
            title="지도"
          />
          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <Navigation className="h-3 w-3" />
            카카오맵에서 보기
          </div>
        </a>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-card-foreground">
              {place.road_address_name || place.address_name}
            </p>
            {place.road_address_name && place.address_name !== place.road_address_name && (
              <p className="mt-0.5 text-xs text-muted-foreground">{place.address_name}</p>
            )}
          </div>
        </div>

        {place.phone && (
          <a href={`tel:${place.phone}`} className="flex items-center gap-2.5 group">
            <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="text-sm text-card-foreground group-hover:text-primary transition-colors">
              {place.phone}
            </span>
          </a>
        )}

        {place.distance && (
          <div className="flex items-center gap-2.5">
            <Navigation className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="text-sm text-muted-foreground">
              {parseInt(place.distance) >= 1000
                ? `${(parseInt(place.distance) / 1000).toFixed(1)}km`
                : `${place.distance}m`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-border px-5 py-4">
        <a
          href={place.place_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          style={{ boxShadow: "var(--shadow-primary)" }}
        >
          <ExternalLink className="h-4 w-4" />
          카카오맵에서 상세보기
        </a>
        <a
          href={`https://map.kakao.com/link/to/${encodeURIComponent(place.place_name)},${place.y},${place.x}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
        >
          <Navigation className="h-4 w-4" />
          길찾기
        </a>
      </div>
    </div>
  );
}

export default BarDetailSheet;
