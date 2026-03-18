import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLike } from "@/hooks/useLike";

interface LikeButtonProps {
  kakaoPlaceId: string;
  initialCount?: number;
}

const LikeButton = ({ kakaoPlaceId, initialCount = 0 }: LikeButtonProps) => {
  const { displayCount, like } = useLike(kakaoPlaceId, initialCount);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        like();
      }}
      className="flex flex-col items-center gap-0.5 group"
      aria-label="좋아요"
    >
      <motion.div whileTap={{ scale: 1.4 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <Heart
          className="h-5 w-5 text-rose-400 transition-colors group-hover:text-rose-500 group-active:fill-rose-400"
          fill={displayCount > 0 ? "currentColor" : "none"}
        />
      </motion.div>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={displayCount}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 4, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[11px] tabular-nums text-muted-foreground leading-none"
        >
          {displayCount > 0 ? displayCount : ""}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

export default LikeButton;
