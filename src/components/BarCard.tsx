import { motion } from "framer-motion";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { KakaoPlace } from "@/lib/kakao";
import { getShortCategory, getCategoryColor } from "@/hooks/useKakaoSearch";
import { getKakaoStaticMapUrl } from "@/lib/kakao-client";

interface BarCardProps {
  place: KakaoPlace;
  index: number;
  onClick?: () => void;
}

const BarCard = ({ place, index, onClick }: BarCardProps) => {
  const shortCategory = getShortCategory(place.category_name);
  const colorClass = getCategoryColor(shortCategory);
  const thumbnailSrc = getKakaoStaticMapUrl({
    lat: place.y,
    lng: place.x,
    width: 160,
    height: 160,
    mapType: "roadview_hybrid",
  });

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="block rounded-xl bg-card p-4 transition-shadow duration-200 cursor-pointer"
      style={{ boxShadow: "var(--shadow-card)" }}
      whileHover={{ boxShadow: "var(--shadow-card-hover)" }}
    >
      <div className="flex gap-3.5">
        {/* Thumbnail */}
        <div
          className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted overflow-hidden"
          style={{ outline: "1px solid rgba(0,0,0,0.08)", outlineOffset: "-1px" }}
        >
          <img
            src={thumbnailSrc}
            alt={place.place_name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl flex items-center justify-center h-full w-full">🍺</span>';
            }}
          />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-card-foreground truncate">
                {place.place_name}
              </h3>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
              {place.road_address_name || place.address_name}
            </p>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
              {shortCategory}
            </span>
            {place.distance && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums">
                <MapPin className="h-3 w-3" />
                {parseInt(place.distance) >= 1000
                  ? `${(parseInt(place.distance) / 1000).toFixed(1)}km`
                  : `${place.distance}m`}
              </span>
            )}
            {place.phone && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {place.phone}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BarCard;
