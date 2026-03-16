import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoGalleryProps {
  photos: string[];
  placeName: string;
  open: boolean;
  onClose: () => void;
}

const PhotoGallery = ({ photos, placeName, open, onClose }: PhotoGalleryProps) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (!open || photos.length === 0) return null;

  const go = (dir: number) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + photos.length) % photos.length);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-background/20 p-2 text-background backdrop-blur-sm transition-colors hover:bg-background/40"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-background/20 px-3 py-1 text-sm font-medium text-background backdrop-blur-sm">
          {index + 1} / {photos.length}
        </div>

        {/* Image */}
        <div className="relative flex h-[80vh] w-[90vw] max-w-3xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.img
              key={photos[index]}
              src={photos[index]}
              alt={`${placeName} ${index + 1}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="max-h-full max-w-full rounded-xl object-contain"
              draggable={false}
            />
          </AnimatePresence>

          {/* Nav buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute left-2 rounded-full bg-background/20 p-2 text-background backdrop-blur-sm transition-colors hover:bg-background/40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => go(1)}
                className="absolute right-2 rounded-full bg-background/20 p-2 text-background backdrop-blur-sm transition-colors hover:bg-background/40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-6 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setDirection(i > index ? 1 : -1); setIndex(i); }}
                className={`h-2 w-2 rounded-full transition-all ${i === index ? "bg-background w-4" : "bg-background/40"}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoGallery;
