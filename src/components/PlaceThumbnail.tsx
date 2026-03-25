import { useState } from "react";
import { usePlacePhoto } from "@/hooks/usePlacePhoto";
import { Camera } from "lucide-react";
import PhotoGallery from "@/components/PhotoGallery";

interface PlaceThumbnailProps {
  placeId: string;
  placeName: string;
  className?: string;
  fallbackSize?: "sm" | "md" | "lg";
  enableGallery?: boolean;
}

const fallbackEmoji: Record<string, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

const PlaceThumbnail = ({ placeId, placeName, className = "", fallbackSize = "md", enableGallery = false }: PlaceThumbnailProps) => {
  const { photoUrl, photos, loading } = usePlacePhoto(placeId);
  const [imgError, setImgError] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const showFallback = !photoUrl || imgError;
  const hasMultiple = photos.length > 1;

  const handleClick = (e: React.MouseEvent) => {
    // When this thumbnail is rendered inside a clickable container (e.g. a Next `Link`),
    // clicking the thumbnail should not trigger the parent navigation.
    if (enableGallery) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (enableGallery && photos.length > 0) setGalleryOpen(true);
  };

  return (
    <>
      <div
        className={`bg-muted overflow-hidden flex items-center justify-center relative ${enableGallery && photos.length > 0 ? "cursor-zoom-in" : ""} ${className}`}
        onClick={handleClick}
      >
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

        {/* Photo count badge */}
        {enableGallery && hasMultiple && !loading && !showFallback && (
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-foreground/60 px-1.5 py-0.5 text-[10px] font-medium text-background">
            <Camera className="h-2.5 w-2.5" />
            {photos.length}
          </div>
        )}
      </div>

      {enableGallery && (
        <PhotoGallery
          photos={photos}
          placeName={placeName}
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
};

export default PlaceThumbnail;
