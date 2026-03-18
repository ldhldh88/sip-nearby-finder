import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, ExternalLink, Navigation, Plus, Loader2 } from "lucide-react";
import { KakaoPlace } from "@/lib/kakao";
import { getShortCategory, getCategoryColor } from "@/hooks/useKakaoSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import PlaceThumbnail from "@/components/PlaceThumbnail";
import LikeButton from "@/components/LikeButton";
import { usePlacePhoto } from "@/hooks/usePlacePhoto";
import { useBarMeta } from "@/hooks/useBarLikeCounts";
import { usePlaceDistricts } from "@/hooks/usePlaceDistricts";
import { useRegionsRaw } from "@/hooks/useRegions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
            <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
              <motion.div
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={spring}
                onClick={(e) => e.stopPropagation()}
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

function DistrictAssigner({ place }: { place: KakaoPlace }) {
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { data: regionsData } = useRegionsRaw();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!selectedDistrictId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke("add-place-to-cache", {
        body: {
          district_id: selectedDistrictId,
          kakao_place_id: place.id,
          place_data: place,
        },
      });
      if (error) throw error;

      toast.success("동네에 등록되었어요!");
      queryClient.invalidateQueries({ queryKey: ["place-districts"] });
      queryClient.invalidateQueries({ queryKey: ["district-bars"] });
    } catch (e) {
      console.error(e);
      toast.error("등록에 실패했어요");
    } finally {
      setIsSaving(false);
    }
  };

  const provinces = regionsData?.provinces ?? [];
  const districts = regionsData?.districts ?? [];

  return (
    <div className="mx-5 mb-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
      <p className="mb-2 text-xs font-medium text-primary">
        <Plus className="mr-1 inline-block h-3 w-3" />
        이 술집이 속한 동네를 선택해 주세요
      </p>
      <div className="flex gap-2">
        <select
          value={selectedDistrictId}
          onChange={(e) => setSelectedDistrictId(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">동네 선택…</option>
          {provinces.map((p) => (
            <optgroup key={p.id} label={p.name}>
              {districts
                .filter((d) => d.province_id === p.id)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={!selectedDistrictId || isSaving}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          등록
        </button>
      </div>
    </div>
  );
}

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
  const { photos } = usePlacePhoto(place.id);
  const { data: metaMap } = useBarMeta([place.id]);
  const likeCount = metaMap?.[place.id]?.like_count ?? 0;
  const { data: districtMap } = usePlaceDistricts([place.id]);
  const districtInfo = districtMap?.[place.id];

  return (
    <div className="flex flex-col">
      {/* Handle bar for mobile */}
      <div className="flex justify-center pt-3 pb-1 md:hidden">
        <div className="h-1 w-10 rounded-full bg-muted" />
      </div>

      {/* Photo gallery banner */}
      {photos.length > 0 && (
        <div className="mx-5 mt-3 overflow-hidden rounded-xl">
          <PlaceThumbnail
            placeId={place.id}
            placeName={place.place_name}
            className="h-48 w-full rounded-xl"
            fallbackSize="lg"
            enableGallery
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {photos.length === 0 && (
            <PlaceThumbnail
              placeId={place.id}
              placeName={place.place_name}
              className="h-14 w-14 flex-shrink-0 rounded-xl"
              fallbackSize="md"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-card-foreground truncate">{place.place_name}</h2>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {districtInfo && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <MapPin className="h-3 w-3" />
                  {districtInfo.districtName}
                </span>
              )}
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                {shortCategory}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LikeButton kakaoPlaceId={place.id} initialCount={likeCount} />
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* District assignment if not cached */}
      {districtMap && !districtInfo && (
        <DistrictAssigner place={place} />
      )}

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
