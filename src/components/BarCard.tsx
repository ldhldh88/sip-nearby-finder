import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Bar } from "@/data/regions";

interface BarCardProps {
  bar: Bar;
  index: number;
}

const categoryColors: Record<string, string> = {
  "전통주점": "bg-amber-100 text-amber-800",
  "칵테일바": "bg-violet-100 text-violet-800",
  "이자카야": "bg-rose-100 text-rose-800",
  "와인바": "bg-red-100 text-red-800",
  "크래프트비어": "bg-yellow-100 text-yellow-800",
  "호프집": "bg-sky-100 text-sky-800",
  "포장마차": "bg-orange-100 text-orange-800",
  "라운지바": "bg-indigo-100 text-indigo-800",
  "소주방": "bg-emerald-100 text-emerald-800",
};

const BarCard = ({ bar, index }: BarCardProps) => {
  const colorClass = categoryColors[bar.category] || "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-xl bg-card p-4 transition-shadow duration-200 cursor-pointer"
      style={{
        boxShadow: "var(--shadow-card)",
      }}
      whileHover={{
        boxShadow: "var(--shadow-card-hover)",
      }}
    >
      <div className="flex gap-3.5">
        {/* Image placeholder */}
        <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center"
             style={{ outline: "1px solid rgba(0,0,0,0.08)", outlineOffset: "-1px" }}>
          <span className="text-2xl">🍺</span>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-card-foreground truncate">{bar.name}</h3>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-sm font-medium tabular-nums text-card-foreground">{bar.rating}</span>
              </div>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{bar.description}</p>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
              {bar.category}
            </span>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums">
              <MapPin className="h-3 w-3" />
              {bar.distance}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BarCard;
