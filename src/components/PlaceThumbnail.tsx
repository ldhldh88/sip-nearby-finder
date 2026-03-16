import { useState } from "react";
import { usePlacePhoto } from "@/hooks/usePlacePhoto";

interface PlaceThumbnailProps {
  placeId: string;
  placeName: string;
  className?: string;
  fallbackSize?: "sm" | "md" | "lg";
}

const fallbackEmoji: Record<string, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

const PlaceThumbnail = ({ placeId, placeName, className = "", fallbackSize = "md" }: PlaceThumbnailProps) => {
  const { photoUrl, loading } = usePlacePhoto(placeId);
  const [imgError, setImgError] = useState(false);

  const showFallback = !photoUrl || imgError;

  return (
    <div className={`bg-muted overflow-hidden flex items-center justify-center ${className}`}>
      {loading && (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}

      {!loading && !showFallback && (
        <img
          src={photoUrl!}
          alt={placeName}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}

      {!loading && showFallback && (
        <span className={`${fallbackEmoji[fallbackSize]} flex items-center justify-center h-full w-full`}>
          🍺
        </span>
      )}
    </div>
  );
};

export default PlaceThumbnail;
