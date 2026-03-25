import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { KakaoPlace } from "@/lib/kakao";
import { getShortCategory, getCategoryColor } from "@/hooks/useKakaoSearch";
import PlaceThumbnail from "@/components/PlaceThumbnail";
import LikeButton from "@/components/LikeButton";
import { Theme } from "@/hooks/useThemes";

interface BarListItemProps {
  place: KakaoPlace;
  index: number;
  onClick?: () => void;
  themes?: Theme[];
  likeCount?: number;
}

const MAX_THEME_CHIPS = 2;

const BarListItem = ({ place, index, themes, likeCount = 0 }: BarListItemProps) => {
  const shortCategory = getShortCategory(place.category_name);
  const colorClass = getCategoryColor(shortCategory);
  const href = `/bar/${encodeURIComponent(place.id)}`;

  const addressLabel = place.road_address_name || place.address_name;
  const themeList = themes ?? [];
  const shownThemes = themeList.slice(0, MAX_THEME_CHIPS);
  const remainingThemes = Math.max(0, themeList.length - shownThemes.length);

  const distanceLabel =
    place.distance && Number.isFinite(parseInt(place.distance))
      ? parseInt(place.distance) >= 1000
        ? `${(parseInt(place.distance) / 1000).toFixed(1)}km`
        : `${place.distance}m`
      : null;

  return (
    <Link href={href} className="block">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02, duration: 0.25 }}
        className="cursor-pointer rounded-lg bg-card p-3 transition-shadow duration-200"
        style={{ boxShadow: "var(--shadow-card)" }}
        whileHover={{ boxShadow: "var(--shadow-card-hover)" }}
      >
        <div className="flex gap-3">
          <PlaceThumbnail
            placeId={place.id}
            placeName={place.place_name}
            className="h-12 w-12 flex-shrink-0 rounded-md"
            fallbackSize="sm"
            enableGallery
          />

          <div className="min-w-0 flex-1 flex justify-between items-start">
            <div className="flex flex-col w-full gap-1">
              <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-card-foreground leading-tight">
                <span className="hover:underline">{place.place_name}</span>
              </h3>

              <p className="mt-0 line-clamp-1 text-xs text-muted-foreground">
                {addressLabel || ""}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${colorClass}`}
                >
                  {shortCategory}
                </span>

                {shownThemes.map((theme) => (
                  <span
                    key={theme.id}
                    className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {theme.name}
                  </span>
                ))}

                {remainingThemes > 0 && (
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    +{remainingThemes}
                  </span>
                )}

                {distanceLabel && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
                    <MapPin className="h-3 w-3" />
                    {distanceLabel}
                  </span>
                )}
              </div>

              
            </div>

            <div className="flex-shrink-0 flex items-center">
              <LikeButton kakaoPlaceId={place.id} initialCount={likeCount} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default BarListItem;

