import { motion } from "framer-motion";
import { MapPin, Flame } from "lucide-react";
import { HotPlace } from "@/hooks/useNearbyBars";
import { getShortCategory, getCategoryColor } from "@/hooks/useKakaoSearch";

interface HotBarCardProps {
  place: HotPlace;
  rank: number;
  onClick?: () => void;
}

const HotBarCard = ({ place, rank, onClick }: HotBarCardProps) => {
  const shortCategory = getShortCategory(place.category_name);
  const colorClass = getCategoryColor(shortCategory);

  const distLabel =
    place.distanceMeters >= 1000
      ? `${(place.distanceMeters / 1000).toFixed(1)}km`
      : `${place.distanceMeters}m`;

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04, duration: 0.25 }}
      className="flex items-center gap-3 rounded-xl bg-card p-3 cursor-pointer transition-shadow"
      style={{ boxShadow: "var(--shadow-card)" }}
      whileHover={{ boxShadow: "var(--shadow-card-hover)" }}
    >
      {/* Rank */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {rank}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-card-foreground truncate">{place.place_name}</h4>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}>
            {shortCategory}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {distLabel}
          </span>
        </div>
      </div>

      {/* Hot Score */}
      <div className="flex flex-col items-center flex-shrink-0">
        <Flame className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-primary">{place.hotScore}</span>
      </div>
    </motion.div>
  );
};

export default HotBarCard;
